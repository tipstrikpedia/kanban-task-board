# Kanban Task Board

The **Kanban Task Board** is a simple web application for managing tasks using a drag‑and‑drop Kanban board.  It allows you to create tasks, edit them, delete them, and move them between the columns **To Do**, **In Progress**, and **Done**.  All your tasks are stored in your browser’s localStorage, so they persist across page reloads.

## Features

- **Add tasks** with a title and optional description.
- **Drag and drop** tasks between columns to update their status.
- **Edit tasks** in a modal to update the title, description, or status.
- **Delete tasks** you no longer need.
- **Dark mode / light mode** toggle with your preference saved in localStorage.
- **Responsive design** so the board works on desktop and mobile.

## Getting Started

These files are meant to be hosted on GitHub Pages or any static web server.  To run locally, open `index.html` in your browser.  To deploy on GitHub Pages:

1. Create a new public repository on GitHub, for example `kanban-task-board`.
2. Upload the contents of this project to the repository root.
3. Enable GitHub Pages in **Settings → Pages** by choosing the `main` branch and the root folder.
4. Visit the provided URL (usually `https://<username>.github.io/<repository-name>/`) to see your live board.

## Project Structure

```
kanban-task-board/
├── index.html     # The main HTML page containing the board structure
├── style.css      # Styles for layout, dark mode, and task cards
├── script.js      # JavaScript logic for tasks and drag-and-drop
└── README.md      # Project documentation
```

## Customization

You can customize the look and feel by editing `style.css`, and extend functionality in `script.js`.  For example, you could add new columns (e.g., **On Hold**), add due dates, or enable exporting tasks to a CSV file.

## License

This project is licensed under the MIT License – you’re free to use, modify, and distribute it for personal or commercial purposes.  See the `LICENSE` file (if provided) for more details.