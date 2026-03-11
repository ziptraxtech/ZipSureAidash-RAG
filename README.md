# 🚀 Getting Started

This guide will help you set up and run the project locally.

---

## 📋 Prerequisites

Make sure the following tools are installed on your system:

* **Node.js:** v18 or higher
* **Python:** 3.12.0
* **Package Manager:** npm or yarn

You can verify installations using:

```bash
node -v
python --version
npm -v
```

---

# ⚙️ Backend Setup (FastAPI)

The backend of this project is powered by **FastAPI**.

### 1. Navigate to the project root directory

```bash
cd project-directory
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

### 3. Activate the virtual environment

**macOS / Linux**

```bash
source venv/bin/activate
```

**Windows**

```bash
.\venv\Scripts\activate
```

### 4. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 5. Start the FastAPI server

```bash
uvicorn backend.main:app --reload
```

✅ Wait until you see:

```
Application startup complete
```


# 💻 Frontend Setup (Next.js)

Open **a new terminal window** while the backend is running.

### 1. Install Node dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```


The frontend server will run at:

```
http://localhost:3000
```

---

# 🌐 Access the Application

Once both servers are running, open your browser and visit:

```
http://localhost:3000
```
