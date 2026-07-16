# SafeNear - Urban Shelter Management System 🚀

**SafeNear** is a comprehensive full-stack application developed for the **Holon Municipality** to manage and locate public shelters in real-time. The system provides residents with life-saving information based on their live GPS location.

---

### 🛠️ Tech Stack
- **Frontend:** React (Vite), JavaScript, CSS3.
- **Backend:** Node.js, Express.js.
- **Database:** **MySQL (Relational Database)**.
- **Infrastructure:** Docker & Docker Compose.
- **APIs:** Interactive Maps & Live GPS Integration.

---

### ✨ Key Features
* **Real-time Location:** Users can find the nearest public shelter based on their current GPS coordinates.
* **Interactive Map:** Visual representation of all city shelters with status updates.
* **Admin Dashboard:** A dedicated management panel for municipality officials to update shelter status, maintenance notes, and availability.
* **Relational Data:** Robust management of shelters, users, and logs using MySQL.

---

### 🏗️ Architecture & Implementation
The project follows a modern Full-Stack architecture:
1.  **Client-Side:** Built with **React** for a fast, single-page application experience.
2.  **Server-Side:** A RESTful API built with **Node.js and Express** to handle business logic and database queries.
3.  **Database Layer:** Managed with **MySQL**, ensuring data integrity and efficient relational mapping for shelter information.
4.  **Containerization:** The entire environment (Client, Server, and MySQL DB) is containerized using **Docker**, ensuring consistency across different environments.

---

### 🚀 How to Run
1. Clone the repository.
2. Ensure you have Docker installed.
3. Run `docker-compose up`.
4. Access the app at `http://localhost:3000`.
