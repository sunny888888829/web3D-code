# MyBrand Web 3D Application

## Project Repository

GitHub repository: https://github.com/sunny888888829/web3D-code.git

## Environment Requirements

No package installation is required for normal use. The project is a static Bootstrap and Three.js website that runs in a modern browser.

Required:

- A modern browser with WebGL enabled, such as Chrome, Edge, Firefox, or Safari.
- A local web server, such as VS Code Live Server, Python `http.server`, MAMP, or XAMPP. Do not open the HTML files directly with `file://`, because JSON, GLB, audio, and video assets should be loaded over HTTP.
- Internet access is recommended for CDN libraries used by the page:
  - Bootstrap 5
  - Font Awesome
  - Google Fonts
  - Three.js and Three.js examples

Recommended local run options:

Option 1, VS Code Live Server:

- Open this project folder in VS Code.
- Right-click `index.html`.
- Choose `Open with Live Server`.

Option 2, Python local server:

```bash
cd "/path/to/your/Web 3D code"
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/index.html
```

The root `index.html` redirects to the final assignment site at:

```text
assignment_final/index.html
```

## Project Structure

- `index.html` - root entry page for the submitted site.
- `assignment_final/index.html` - main Web 3D application.
- `assignment_final/submission.html` - submission links and project evidence.
- `assignment_final/assets/models/` - GLB model files.
- `assignment_final/assets/audio/` - local MP3 audio files.
- `assignment_final/assets/video/` - generated MP4 promotional video.
- `assignment_final/assets/data/models.json` - model metadata used by the app.

## Notes for Marking

The project has been tested successfully on a local HTTP server. All submission links are local project links. The Technical Statement, Testing Feedback, Model Metadata, Source Archives, Promotional Video, and Modeling Log links open readable HTML pages first, with raw/downloadable assets linked from those pages where appropriate.
