# Youth Balance

A Flask web application designed to help young people maintain balance in their daily lives through task management, wellbeing resources, and personal development tools.

## Features

- **User Authentication**: Secure login and signup system
- **Dashboard**: Personalized user dashboard
- **Task Management**: Create, edit, and track daily tasks
- **Wellbeing Resources**: Self-care tips and mental health guidance
- **Notes System**: Personal note-taking with categories
- **Goals Tracking**: Set and monitor personal goals
- **Responsive Design**: Works on desktop and mobile devices

## Installation

1. Clone the repository:
```bash
git clone https://github.com/amiraashraf0210/youth-balance.git
cd youth-balance
```

2. Install required dependencies:
```bash
pip install flask
```

3. Run the application:
```bash
python app.py
```

4. Open your browser and go to `http://localhost:5000`

## Default Test Account

- **Username**: test
- **Password**: 123

## Technologies Used

- **Backend**: Python Flask
- **Database**: SQLite
- **Frontend**: HTML, CSS, JavaScript
- **Icons**: Font Awesome

## Project Structure

```
youth-balance/
├── app.py              # Main Flask application
├── users.db            # SQLite database
├── static/
│   ├── style.css       # Main stylesheet
│   └── dashboard.js    # Dashboard functionality
└── templates/
    ├── home.html       # Landing page
    ├── login.html      # Login page
    ├── signup.html     # Registration page
    ├── dashboard.html  # User dashboard
    ├── tasks.html      # Task management
    ├── wellbeing.html  # Wellbeing resources
    └── resources.html  # Additional resources
```

## Contributing

Feel free to fork this project and submit pull requests for any improvements.

## License

This project is open source and available under the MIT License.