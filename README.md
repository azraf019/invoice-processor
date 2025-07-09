# InvoiceAI Processor: Intelligent Invoice Data Extraction

InvoiceAI Processor is a powerful, full-stack web application designed to automate the extraction of data from PDF invoices. Using Google's Gemini AI, it intelligently parses single or multiple PDF documents, extracts key information, and presents it in a clean, user-friendly interface. Users can then review, edit, and export the data to an Excel spreadsheet, streamlining accounting and data entry workflows.

![InvoiceAI Processor Screenshot](https://i.imgur.com/your-screenshot-url.png) 
*(To add a screenshot: take a picture of your running application, upload it to a service like Imgur, and paste the URL here.)*

---

## ✨ Key Features

- **AI-Powered Data Extraction**: Leverages Google's Gemini model to accurately parse and extract data from PDF invoices.
- **Single & Bulk PDF Uploads**: Process invoices one by one or upload multiple files for efficient batch processing.
- **Interactive Data Table**: View all processed invoices in a clean, sortable, and responsive table.
- **Side-by-Side PDF Viewer**: Click on any invoice to open a detailed view with the original PDF alongside the extracted data.
- **In-Place Editing**: Correct or amend extracted data directly in the detail view and save changes instantly to the database.
- **Export to Excel**: Download all processed invoice data as a `.xlsx` file with a single click.
- **Persistent Storage**: All invoice data is securely stored in a MongoDB database for easy access and management.
- **Modern Tech Stack**: Built with React, Node.js, Express, and MongoDB for a robust and scalable solution.

---

## 🛠️ Tech Stack

### Frontend
- **React**: A JavaScript library for building user interfaces.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **Axios**: A promise-based HTTP client for making API requests.

### Backend
- **Node.js**: A JavaScript runtime built on Chrome's V8 engine.
- **Express**: A minimal and flexible Node.js web application framework.
- **MongoDB**: A NoSQL database for storing invoice data.
- **Mongoose**: An elegant MongoDB object modeling tool for Node.js.
- **Google Gemini API**: For state-of-the-art AI-powered data extraction from PDFs.
- **Multer**: A Node.js middleware for handling `multipart/form-data`, used for file uploads.

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running.
- A **Google Gemini API Key**. You can obtain one from the [AI Studio](https://aistudio.google.com/app/apikey).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/invoice-processor.git](https://github.com/your-username/invoice-processor.git)
    cd invoice-processor
    ```

2.  **Backend Setup:**
    - Navigate to the `server` directory:
      ```bash
      cd server
      ```
    - Install backend dependencies:
      ```bash
      npm install
      ```
    - Create a `.env` file in the `server` directory and add your configuration:
      ```
      # .env
      MONGODB_URI=mongodb://localhost:27017/invoice_db
      GEMINI_API_KEY=YOUR_GEMINI_API_KEY
      ```
    - Start the backend server:
      ```bash
      npm run dev
      ```
    The server will be running on `http://localhost:5000`.

3.  **Frontend Setup:**
    - Open a new terminal and navigate to the `client` directory:
      ```bash
      cd client
      ```
    - Install frontend dependencies:
      ```bash
      npm install
      ```
    - Start the React development server:
      ```bash
      npm start
      ```
    The application will open automatically in your browser at `http://localhost:3000`.

---

## Usage

1.  **Upload Invoices**: Drag and drop one or more PDF files onto the upload area, or click to select files.
2.  **Process**: Click the "Upload & Process" button. The application will send the files to the backend, where Gemini will extract the data.
3.  **View & Edit**: The extracted data will appear in the "All Processed Invoices" table. Click the eye icon (`👁️`) to open the detail view, where you can see the PDF and edit the extracted fields.
4.  **Save**: After making changes in the detail view, click the "Save" button to update the record in the database.
5.  **Export**: Click the "Export to Excel" button to download a spreadsheet of all your invoice data.

---

## 📝 API Endpoints

| Method | Endpoint              | Description                               |
| :----- | :-------------------- | :---------------------------------------- |
| `GET`  | `/api/`               | Fetches all processed invoices.           |
| `POST` | `/api/bulk-upload`    | Uploads and processes multiple PDFs.      |
| `PUT`  | `/api/:id`            | Updates a specific invoice by its ID.     |
| `GET`  | `/api/export-excel`   | Exports all invoice data to an Excel file.|
| `DELETE`| `/api/clear`         | Deletes all invoices and uploaded files.  |

---

## 🚧 To-Do / Future Enhancements

- [ ] Add user authentication to manage invoices per user.
- [ ] Implement more robust error handling and user feedback.
- [ ] Add pagination for the invoices table.
- [ ] Allow users to define custom extraction prompts from the UI.
- [ ] Write unit and integration tests.

---

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improving the application, please feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.
