# Acara VMS (Volunteer Management System)

Acara VMS is a low-cost, open-source Volunteer Management System originally created by a team of 6 individuals as a capstone project for a master's program at Harvard's Division of Continuing Education (HES). 

It was specifically designed for a small hospice agency that had outgrown Excel spreadsheets for managing volunteers but did not want the overhead and expense of large enterprise solutions like Salesforce Volunteers. This makes it an ideal solution for other small non-profits and agencies with similar needs.

## Tech Stack
- **Frontend**: Next.js (React), Tailwind CSS
- **Backend**: Django (Python)
- **Database**: PostgreSQL

## Features
- Volunteer profile management
- Easy, low-cost deployment and maintenance
- Designed to be a simple, effective alternative to complex Excel spreadsheet tracking

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- PostgreSQL

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/acara_vms.git
   cd acara_vms/vms
   ```

2. **Database Setup**
   Ensure you have PostgreSQL running and create a database for the project.

3. **Backend Setup (Django)**
   ```bash
   # Create and activate a virtual environment
   python -m venv venv
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Setup environment variables
   cp .env.example .env
   # Update .env with your local database credentials and JWT/Django secrets
   
   # Run database migrations
   python manage.py migrate
   
   # Run the development server (runs on port 8000 by default)
   python manage.py runserver
   ```

4. **Frontend Setup (Next.js)**
   ```bash
   # In a new terminal window, ensure you are in the vms directory
   cd acara_vms/vms
   
   # Install Node dependencies
   npm install
   
   # Start the frontend development server
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Deployment
For detailed deployment instructions (e.g., using AWS Lightsail, PM2, and Nginx), please refer to the [Deployment Setup Guide](./vms/test_deployment_setup.md).

## Contributing
Contributions are welcome! If you find this project useful for your organization and want to add features or fix bugs, please feel free to fork the repository and submit a pull request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
