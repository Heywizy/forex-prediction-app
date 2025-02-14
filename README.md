# **Forex Tracking and Prediction App**
### 📊 AI-Powered Forex Price Prediction  

![Screenshot 2025-02-14 125656](https://github.com/user-attachments/assets/a3bf6dc5-3b18-46e2-8576-573d019a3d17)


## **Overview**  
This project is a **Forex tracking and prediction system** built with **Flask, TensorFlow, and Chart.js**. It collects real-time Forex data, trains an ML model, and provides **buy, sell, or hold recommendations** based on AI-driven predictions.  

### **Features:**  
✅ Real-time Forex data tracking 📈  
✅ AI-powered price predictions 🎯  
✅ Interactive chart visualization 📊  
✅ Historical data export (CSV) 📂  
✅ User-friendly web interface 🌐  

---

## **🚀 Installation & Setup**  
### **1. Clone the Repository**  
```bash
git clone https://github.com/YOUR-USERNAME/forex-prediction-app.git  
cd forex-prediction-app  
```

### **2. Create & Activate a Virtual Environment**  
```bash
# On Windows
python -m venv venv  
venv\Scripts\activate  

# On macOS/Linux
python3 -m venv venv  
source venv/bin/activate  
```

### **3. Install Dependencies**  
```bash
pip install -r requirements.txt  
```

### **4. Run the Application**  
```bash
python app.py  
```
Then open your browser and go to **`http://127.0.0.1:5000`**  

---

## **🖼️ Screenshots**  
![Screenshot 2025-02-14 132052](https://github.com/user-attachments/assets/620fbedf-9f6c-4c5c-8531-80e8657e13b6)
![Screenshot 2025-02-14 131909](https://github.com/user-attachments/assets/c595d496-5684-44c9-8cf3-cdcfcfa048fe)
![Screenshot 2025-02-14 131800](https://github.com/user-attachments/assets/512ec0af-1469-4752-8f8a-405dba68a8d7)



---

## **📜 How It Works**  
1️⃣ **Data Collection:** Fetches real-time Forex data.  
2️⃣ **Model Training:** Uses TensorFlow to predict future closing prices.  
3️⃣ **Visualization:** Displays predictions with interactive charts.  
4️⃣ **Decision Support:** Provides **Buy, Sell, or Hold** recommendations.  

---

## **📂 Exporting Data**  
- You can export historical Forex data as a **CSV file** using the **Export Data** button.  
- If multiple tickers are selected, the data will be exported as a ZIP file.  

---

## **🔗 API Endpoints**  
| Method | Endpoint | Description |  
|--------|---------|-------------|  
| `GET` | `/get_forex_data?ticker=USD/EUR` | Fetch Forex data |  
| `POST` | `/predict_forex` | Predict closing price |  
| `GET` | `/export_data` | Export data as CSV/ZIP |  

---

## **🛠️ Built With**  
🔹 **Python + Flask** - Backend API  
🔹 **TensorFlow** - Machine Learning Model  
🔹 **Chart.js** - Frontend Data Visualization  
🔹 **HTML, CSS, JavaScript** - Web Interface  

---

## **💡 Future Improvements**  
✅ Add more technical indicators 📊  
✅ Improve prediction accuracy 🔥  
✅ Deploy on AWS 🚀  

---

## **📜 License**  
This project is **MIT licensed** – feel free to use and improve!  

---

## **⭐ Contribute & Support**  
Found this helpful? Give it a ⭐ on GitHub!  

---

## **📢 Connect With Me**  
- **GitHub:** (https://github.com/Heywizy)  
- **LinkedIn:** (www.linkedin.com/in/ayomide-olaleye-olamiposi)  
- **TikTok:** @heywizy *(For AI/ML content!)*  
