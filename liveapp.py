from flask import Flask, render_template, request, jsonify, session, send_file
import pandas as pd
import numpy as np
import requests
from keras.models import Sequential, load_model
from keras.layers import LSTM, Dense, Dropout
import os
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import MinMaxScaler
from math import sqrt
import csv
from datetime import datetime
import zipfile
import pathlib
import io
import socket
import webbrowser
from threading import Timer

app = Flask(__name__)
app.secret_key = "PFP"
hostname = socket.gethostname()
IPAddr = socket.gethostbyname(hostname)

scaler = MinMaxScaler(feature_range=(0, 1))

API_KEY = 'JNVVT9UZUTJK4SGA'
BASE_URL = 'https://www.alphavantage.co/query'

def open_browser():
    webbrowser.open_new(f"http://{IPAddr}/")

# Fetch forex data
def fetch_forex_data(ticker):
    from_currency, to_currency = ticker.split('/')
    params = {
        'function': 'FX_DAILY',
        'from_symbol': from_currency.upper(),
        'to_symbol': to_currency.upper(),
        'apikey': API_KEY,
        'outputsize': 'full'
    }
    response = requests.get(BASE_URL, params=params)
    print(f"API Request URL: {response.url}")  # Add this to debug the URL
    data = response.json().get('Time Series FX (Daily)', {})
    
    if not data:
        print(f"API Response: {response.json()}")  # Check the full API response
        raise ValueError(f"No data returned for {ticker}")


    # Convert to DataFrame directly
    df = pd.DataFrame.from_dict(data, orient='index')

    # Check for expected columns and use them
    # Update the column name based on available columns
    expected_column = None
    for column in df.columns:
        if 'close' in column.lower():
            expected_column = column
            break

    if not expected_column:
        raise KeyError(f"Close price column not found in data for {ticker}")

    df = df[[expected_column]]
    df.columns = ['Close']
    df.index = pd.to_datetime(df.index)
    df.sort_index(inplace=True)

    return df

# Preprocess data
def preprocess_data(df, sequence_length=60):
       # Sort the data by date
    df = df.sort_index(ascending=True)

    # Normalize the 'close' prices
    close_prices = df['Close'].values.reshape(-1, 1)  # Reshape for scaler
    scaled_data = scaler.fit_transform(close_prices)

    # Prepare sequences for LSTM
    result = []
    for index in range(len(scaled_data) - sequence_length):
        result.append(scaled_data[index: index + sequence_length])

    result = np.array(result)
    return result

def inverse_scale(prediction):
    return scaler.inverse_transform(prediction)


# Build and train LSTM model
def build_lstm_model(input_shape):
    model = Sequential()
    model.add(LSTM(units=50, return_sequences=True, input_shape=input_shape))
    model.add(Dropout(0.2))
    model.add(LSTM(units=50, return_sequences=False))
    model.add(Dropout(0.2))
    model.add(Dense(units=1))
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

def calculate_nrmse(y_true, y_pred):
    rmse = np.sqrt(np.mean((y_true - y_pred)**2))
    range_of_values = np.max(y_true) - np.min(y_true)
    return rmse / range_of_values

predictions_dir = os.path.join(os.getenv('APPDATA'), 'FxPredictor', 'predictions')

def store_prediction_in_history(ticker, prediction, confidence, advice):
    safe_ticker = ticker.upper().replace('/', '_')
    filename = os.path.join(predictions_dir, f'{safe_ticker}_predictions.csv')

    # Ensure the directory exists
    if not os.path.exists(predictions_dir):
        os.makedirs(predictions_dir)
    
    column_headers = ['Ticker', 'Prediction', 'Confidence', 'Advice', 'Date']

    # Check if the file exists
    file_exists = os.path.isfile(filename)


    date = datetime.now().strftime('%Y-%m-%d')
    with open(filename, mode='a', newline='') as file:
        writer = csv.writer(file)
        if not file_exists:
            writer.writerow(column_headers)
        writer.writerow([ticker, prediction, confidence, advice, date])

def fetch_actual_closing_price(symbol, date):
    from_currency, to_currency = symbol.split('/')
    params = {
        'function': 'FX_DAILY',
        'from_symbol': from_currency,
        'to_symbol': to_currency,
        'apikey': API_KEY,
        'outputsize': 'compact'
    }
    response = requests.get(BASE_URL, params=params)
    data = response.json().get('Time Series FX (Daily)', {})
    actual_price = data.get(date, {}).get('4. close', None)
    return float(actual_price) if actual_price else None

def compare_prediction_with_actual(ticker):
    safe_ticker = ticker.upper().replace('/', '_')
    filename = os.path.join(predictions_dir, f'{safe_ticker}_predictions.csv') 
    comparisons = []
    with open(filename, mode='r') as file:
        reader = csv.reader(file)
        for row in reader:
            symbol, predicted_price, Confidence, Advice, date = row
            if symbol == ticker:
                actual_price = fetch_actual_closing_price(symbol, date)
                if actual_price:
                    # Check if predicted_price is a string representation of an array
                    if predicted_price.startswith("[[") and predicted_price.endswith("]]"):
                        predicted_price = eval(predicted_price)[0][0]  # Convert string to float
                    else:
                        predicted_price = float(predicted_price)  # Convert directly to float
                    
                    difference = actual_price - predicted_price
                    comparisons.append((symbol, predicted_price, actual_price, date, difference))
    return comparisons

models_dir = os.path.join(os.getenv('APPDATA'), 'FxPredictor', 'models')

def save_model(model, ticker):
    safe_ticker = ticker.upper().replace('/', '_')
    filename = os.path.join(models_dir, f'model_{safe_ticker}.h5')
    model.save(filename)


@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route('/get_forex_data/', methods=['POST'])
def get_forex_data():
    try:
        tickers = request.form.get('tickers')

        if not tickers:
            raise ValueError("No tickers provided.")
        
        ticker_list = [ticker.strip().lower() for ticker in tickers.split(',')]
        session['ticker_list'] = ticker_list
        
        data = {
            'dates': [],
            'pairs': []
        }

        
        
        for ticker in ticker_list:
            # Sanitize ticker for filename
            safe_ticker = ticker.upper().replace('/', '_')
            forex_data_dir = os.path.join(os.getenv('APPDATA'), 'FxPredictor', 'forex_data')
            session['forex_data_dir'] = forex_data_dir

            # Ensure the directory exists
            if not os.path.exists(forex_data_dir):
                 os.makedirs(forex_data_dir)

            filename = os.path.join(forex_data_dir, f'{safe_ticker}_data.csv')


            df = fetch_forex_data(ticker)
            df.to_csv(filename)
            
            dates = df.index.strftime('%Y-%m-%d').tolist()
            prices = df['Close'].tolist()
            
            if not data['dates']:
                data['dates'] = dates  # Set dates for the first time
            data['pairs'].append({
                'pair': ticker.upper(),  # Display in uppercase for clarity
                'dates': dates,
                'prices': prices
            })

        return jsonify(data)

    except Exception as e:
        print(f"Error occurred in get_forex_data: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/export_data/', methods=['GET'])
def export_data():
    ticker_list = session.get('ticker_list')
    forex_data_dir = session.get('forex_data_dir')
    
    if len(ticker_list) == 1:
        ticker = ticker_list[0]
        file_path = f'{forex_data_dir}\{ticker.replace("/", "_")}_data.csv'
        
        if not os.path.exists(file_path):
            return jsonify({'error': f"No data available for {ticker}"}), 404

        # Serve the single CSV file for download
        return send_file(file_path, mimetype='text/csv', download_name=f'{ticker}_data.csv', as_attachment=True)
    
    else:
        # Create an in-memory zip file
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
            for ticker in ticker_list:
                file_path = f'{forex_data_dir}\{ticker.replace("/", "_")}_data.csv'
                
                if not os.path.exists(file_path):
                    return jsonify({'error': f"No data available for {ticker}"}), 404
                
                zip_file.write(file_path, arcname=f'{ticker.replace("/", "_")}_data.csv')

        zip_buffer.seek(0)
        
        # Serve the zip file for download
        return send_file(zip_buffer, mimetype='application/zip', download_name='forex_data.zip', as_attachment=True)

@app.route('/predict_forex/', methods=['POST'])
def predict_forex():
    ticker = request.form['ticker']
    session['ticker'] = ticker

    safe_ticker = ticker.upper().replace('/', '_')
    session['safe_ticker'] = safe_ticker

    # Load data from CSV
    forex_data_dir = session.get('forex_data_dir')
    filename = f'{forex_data_dir}\{ticker.replace("/", "_").upper()}_data.csv'
    if not os.path.exists(filename):
        raise FileNotFoundError(f"No data file found for ticker: {ticker}")
    
    df = pd.read_csv(filename, index_col=0, parse_dates=True)
    
    # Preprocess the data
    data = preprocess_data(df)
    
    # Load or train model
    model_path = f'{models_dir}\model_{safe_ticker}.h5'
    if os.path.exists(model_path):
        model = load_model(model_path) 
    else:
        input_shape = (data.shape[1], 1)
        model = build_lstm_model(input_shape)
        model.fit(data, data[:, -1], epochs=5, batch_size=32)
        save_model(model= model, ticker= ticker)
    
    # Make prediction
    prediction = model.predict(data[-1].reshape(1, -1, 1))

    # Reverse the scaling to get the original value
    prediction_value = inverse_scale(prediction)[0, 0]


    # Calculate RMSE as a proxy for confidence score
    y_true = data[:, -1]  # Actual closing prices
    y_pred = model.predict(data.reshape(data.shape[0], data.shape[1], 1)).flatten()

    # Reverse the scaling for both true and predicted values
    y_true = scaler.inverse_transform(y_true.reshape(-1, 1)).flatten()
    y_pred = scaler.inverse_transform(y_pred.reshape(-1, 1)).flatten()

    nrmse = calculate_nrmse(y_true, y_pred)
    confidence_score = max(0, 100 - (nrmse * 100))  # Normalize confidence based on the range


    # Logic for advice
    last_closing_price = scaler.inverse_transform(data[-1, -1].reshape(1, -1))[0, 0]
    if prediction_value > last_closing_price * 1.01:  # Example threshold for 'Buy'
        advice = "Buy"
    elif prediction_value < last_closing_price * 0.99:  # Example threshold for 'Sell'
        advice = "Sell"
    else:
        advice = "Hold"

    # Combine into a sentence
    confidence_percentage = round(confidence_score, 2)
    sentence = (f"Our model predicts that the closing price for {ticker.upper()} will be {prediction_value:.4f}. "
                f"Based on this, we advise you to {advice}. "
                f"Our confidence in this prediction is {confidence_percentage}%.")

    # Store the prediction in a CSV file
    store_prediction_in_history(ticker=ticker, prediction=prediction_value, confidence=confidence_score, advice=advice)

    return jsonify({'prediction_sentence': sentence})

@app.route('/prediction_history')
def prediction_history():
    ticker = session.get('ticker')
    safe_ticker = session.get("safe_ticker")
    file_path = f'{predictions_dir}\{safe_ticker}_predictions.csv'
    if not os.path.exists(file_path):
        return jsonify({'error': 'No prediction history found.'}), 404
    
    history = pd.read_csv(file_path)
    
    return render_template('history.html', ticker=ticker, history=history) 


@app.route('/compare_prediction/', methods=['POST'])
def compare_prediction():
    date = request.form['date']
    ticker = session.get('ticker')  # Retrieve ticker from session
    if not ticker:
        return jsonify({'comparison_result': 'No ticker found in session.'})

    comparisons = compare_prediction_with_actual(ticker)
    comparison_result = ""
    for symbol, predicted, actual, prediction_date, difference in comparisons:
        if date == prediction_date:
            comparison_result += (f"On {date}, for {symbol}, the predicted closing price was {predicted:.4f}. "
                                  f"The actual closing price was {actual:.4f}. "
                                  f"The difference is {difference:.4f}.<br>")
    if not comparison_result:
        comparison_result = "No predictions found for the selected date."
    return jsonify({'comparison_result': comparison_result})


if __name__ == '__main__':
    Timer(1, open_browser).start()
    app.run(host=str(IPAddr) , port =80, debug=False, use_reloader=False, threaded=True)