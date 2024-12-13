from flask import Flask, request
import subprocess

app = Flask(__name__)

@app.route('/download', methods=['POST'])
def download_torrent():
    torrent_url = request.json.get('torrent_url')
    if torrent_url:
        # Run your script to download the torrent
        subprocess.run(['python', 'download_script.py', torrent_url])
        return {'status': 'success', 'message': 'Downloading torrent...'}, 200
    return {'status': 'error', 'message': 'No torrent URL provided'}, 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)  # Listen on all interfaces