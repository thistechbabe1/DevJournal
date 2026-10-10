# DevJournal: An AI-Powered Developer's Journal

DevJournal is a modern, full-stack web application designed to help developers document their coding journey, track their progress, and gain intelligent insights into their work. It combines a rich text editor for detailed note-taking with a powerful AI assistant to provide feedback, suggest resources, and analyze journal entries.

This project is built with a decoupled architecture, featuring an Angular frontend and a Node.js/Express backend, making it scalable and maintainable.

---

## ✨ Key Features

- **📝 Rich Text Journaling:** Create, edit, and view journal entries using a feature-rich WYSIWYG editor (powered by TinyMCE) that supports code blocks, lists, and various text formatting options.
- **🖼️ Image & Media Support:** Upload and associate a cover image with each journal entry via Cloudinary integration.
- **🏷️ Smart Organization:** Categorize and tag your entries for easy searching and filtering.
- **🤖 AI-Powered Insights:** Get intelligent analysis of your journal entries, including sentiment, key themes, actionable advice, and resource recommendations, powered by the Google Gemini API.
- **💬 AI Chat Assistant:** A dedicated chat interface to ask coding questions and get help from an AI mentor.
- **📄 PDF Export:** Export your beautifully formatted journal entries, including images and styled content, as high-quality PDF documents.
- **🔐 Secure Authentication:** User registration and login system using JSON Web Tokens (JWT) to secure user data and API endpoints.
- **🚀 Decoupled Architecture:** A robust Angular single-page application for the frontend and a separate Node.js, Express, and MongoDB backend API.

---

## 🛠️ Tech Stack

### Frontend

- **[Angular](https://angular.io/)** (v16)
- **[TypeScript](https://www.typescriptlang.org/)**
- **[Bootstrap](https://getbootstrap.com/)** & **[SCSS](https://sass-lang.com/)** for styling
- **[html2pdf.js](https://github.com/eKoopmans/html2pdf.js)** for PDF generation

### Backend

- **[Node.js](https://nodejs.org/)**
- **[Express.js](https://expressjs.com/)** for the REST API framework
- **[MongoDB](https://www.mongodb.com/)** with **[Mongoose](https://mongoosejs.com/)** for the database
- **[JSON Web Token (JWT)](https://jwt.io/)** for authentication
- **[Cloudinary](https://cloudinary.com/)** for image storage and management
- **[Google Gemini API](https://ai.google.dev/)** for generative AI features
- **Health Check & Uptime:** `GET /health` lightweight, unauthenticated endpoint for uptime pingers (no database access)
