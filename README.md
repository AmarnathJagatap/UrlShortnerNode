### Auth
---

### 1️⃣ **User Registration** (`POST /api/users`)
```sh
curl -X POST https://urlshortner-hqtv.onrender.com/api/users \
-H "Content-Type: application/json" \
-d '{
  "name": "John Doe",
  "email": "johndoe@example.com",
  "password": "securepassword123"
}'
```

---

### 2️⃣ **User Login (Authentication)** (`POST /api/users/auth`)
```sh
curl -X POST https://urlshortner-hqtv.onrender.com/api/users/auth \
-H "Content-Type: application/json" \
-d '{
  "email": "johndoe@example.com",
  "password": "securepassword123"
}'
```

---

### 3️⃣ **Google Authentication** (`POST /api/users/googleauth`)
```sh
curl -X POST https://urlshortner-hqtv.onrender.com/api/users/googleauth \
-H "Content-Type: application/json" \
-d '{
  "code": "GOOGLE_AUTHORIZATION_CODE"
}'
```
🔹 Replace `"GOOGLE_AUTHORIZATION_CODE"` with the actual authorization code received from Google OAuth flow.  

---

### Url Shortner

### 1️⃣ **Create a Short URL**
```sh
curl -X POST https://urlshortner-hqtv.onrender.com/shorten \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
-d '{
  "longUrl": "https://example.com",
  "customAlias": "mycustomalias",
  "topic": "technology"
}'
```

---

### 2️⃣ **Redirect a Short URL**
```sh
curl -X GET https://urlshortner-hqtv.onrender.com/mycustomalias
```

---

### 3️⃣ **Get Analytics for a Specific URL**
```sh
curl -X GET https://urlshortner-hqtv.onrender.com/analytics/mycustomalias \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 4️⃣ **Get Analytics for a Specific Topic**
```sh
curl -X GET https://urlshortner-hqtv.onrender.com/analytics/topic/technology \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 5️⃣ **Get Overall Analytics for the User**
```sh
curl -X GET https://urlshortner-hqtv.onrender.com/analytics/overall \
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

Replace `YOUR_ACCESS_TOKEN` with a valid JWT token if authentication is required.  

## **Documentation
## **https://documenter.getpostman.com/view/16407557/2sAYXEEHqz**

## **📌 URL Shortener API**  
A simple **Node.js** API for shortening URLs, tracking analytics, and user authentication.

### **🚀 Features**
- Shorten URLs
- Redirect short URLs to original URLs
- Track analytics for each URL
- User authentication (login, registration, Google OAuth)
- Rate limiting for URL creation

---

## **📂 Project Structure**
```
📦 UrlShortnerNode
 ┣ 📂 api
 ┃ ┣ 📂 controllers       # API logic (URL & user controllers)
 ┃ ┣ 📂 middleware        # Middleware (Auth, rate limiter)
 ┃ ┣ 📂 models            # Database models
 ┃ ┣ 📂 routes            # API routes
 ┃ ┣ 📂 config            # Database connection
 ┃ ┣ 📂 utils             # Helper functions
 ┃ ┗ server.js            # Entry point
 ┣ 📜 .env.example        # Environment variables template
 ┣ 📜 Dockerfile          # Docker setup
 ┣ 📜 docker-compose.yml  # Docker Compose (optional)
 ┣ 📜 package.json        # Dependencies
 ┣ 📜 README.md           # Documentation
 ┗ 📜 .gitignore          # Ignore unnecessary files
```

---

## **🛠️ Setup & Installation**
### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/AmarnathJagatap/UrlShortnerNode.git
cd UrlShortnerNode
```

### **2️⃣ Install Dependencies**
```sh
npm install
```

### **3️⃣ Create `.env` File**
Copy `.env.example` to `.env` and update the values:
```sh
cp .env.example .env
```
Example `.env` file:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/urlShortener
JWT_SECRET=your_secret_key
NODE_ENV=development
BASE_URL=http://localhost:5000
```

### **4️⃣ Start the Server**
```sh
npm start
```
API will be available at **`http://localhost:5000`** 🚀

---

## **🐳 Running with Docker**
### **1️⃣ Build the Docker Image**
```sh
docker build -t url-shortener-api .
```

### **2️⃣ Run the Container**
```sh
docker run --env-file .env -p 5000:5000 url-shortener-api
```

Now, the API is accessible at **`http://localhost:5000`** 🚀

---

## **🐳 Using Docker Compose**
For easier management, use **Docker Compose**:

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "5000:5000"
    env_file:
      - .env
    restart: always
```

Run:
```sh
docker-compose up --build
```

---

## **🔗 API Endpoints**
### **🔑 Authentication**
| Method | Endpoint             | Description            |
|--------|----------------------|------------------------|
| POST   | `/api/users/`         | Register a new user    |
| POST   | `/api/users/auth`     | Login user            |
| POST   | `/api/users/logout`   | Logout user           |
| POST   | `/api/users/googleauth` | Google OAuth login   |

### **🔗 URL Shortener**
| Method | Endpoint                      | Description                      |
|--------|--------------------------------|----------------------------------|
| POST   | `/shorten`                     | Create a short URL (protected)  |
| GET    | `/:alias`                      | Redirect to original URL        |
| GET    | `/analytics/overall`           | Get overall analytics (protected) |
| GET    | `/analytics/:alias`            | Get analytics for a URL (protected) |
| GET    | `/analytics/topic/:topic`      | Get analytics for a topic (protected) |

---

## **💾 Database**
This project uses **MongoDB**.  
You can use **local MongoDB** or a **cloud database (MongoDB Atlas)**.

### **Run MongoDB Locally (Docker)**
```sh
docker run -d -p 27017:27017 --name mongodb mongo
```

---

## **📜 Dockerfile**
```dockerfile
# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy project files
COPY . .

# Expose port
EXPOSE 5000

# Start the app
CMD ["node", "server.js"]
```

---

## **🎯 Conclusion**
Now you have a **fully functional URL shortener API** with:
✅ Authentication  
✅ URL shortening  
✅ Analytics tracking  
✅ Docker support  

🚀 **Run the API and start shortening URLs!** 🚀
