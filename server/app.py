# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from qbittorrentapi import Client
import os
import subprocess
import time
import platform

app = Flask(__name__)
CORS(app)

print(f"Python executable: {os.sys.executable}")
print(f"os.name: {os.name}, platform: {os.sys.platform}, platform.system(): {platform.system()}")

# qBittorrent configuration
# If your Flask server and qBittorrent are on the same Windows machine, use:
# QB_HOST = 'localhost'
# If your Flask server is on another machine (or WSL), use your Windows machine's LAN IP address.
# Example: QB_HOST = '192.168.1.100'  # Replace with your actual Windows IP

QB_HOST = os.environ.get('QB_HOST', 'localhost')
QB_PORT = os.environ.get('QB_PORT', '8080')
QB_USERNAME = os.environ.get('QB_USERNAME', 'Gonzo2510')
QB_PASSWORD = os.environ.get('QB_PASSWORD', 'Password1!')
QB_DOWNLOAD_LOCATION = os.environ.get('QB_DOWNLOAD_LOCATION', r'D:\Movies 3tb')


def launch_qbittorrent():
    """
    Attempt to launch qBittorrent (desktop client with Web UI enabled).
    Only works if running on Windows.
    """
    try:
        qb_path = r"C:\Program Files\qBittorrent\qbittorrent.exe"
        print(f"Checking for qBittorrent at: {qb_path}")
        print(f"os.name: {os.name}, platform: {os.sys.platform}")
        if os.name != "nt":
            print("Not running on Windows. Skipping qBittorrent launch. You must start qBittorrent manually on your Windows machine.")
            return
        if os.path.exists(qb_path):
            print("qBittorrent executable found, attempting to launch...")
            subprocess.Popen([qb_path])
            print(f"Attempted to launch qBittorrent at {qb_path}.")
            time.sleep(5)
        else:
            print(f"Could not find qBittorrent executable at {qb_path}.")
    except Exception as e:
        print(f"Failed to launch qBittorrent: {e}")

try:
    qb = Client(
        host=f'http://{QB_HOST}:{QB_PORT}',
        username=QB_USERNAME,
        password=QB_PASSWORD
    )
    qb.auth_log_in()
    print("Successfully connected to qBittorrent Web UI.")
except Exception as e:
    print(f"Failed to connect to qBittorrent: {e}")
    qb = None  # Do not launch here

def wait_for_qbittorrent_webui(host, port, timeout=20):
    """Wait for qBittorrent Web UI to become available."""
    import requests
    import time
    url = f"http://{host}:{port}/api/v2/app/version"
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(url, timeout=2)
            if r.status_code == 200:
                print(f"qBittorrent Web UI is up. Version: {r.text}")
                return True
            else:
                print(f"qBittorrent Web UI responded with status: {r.status_code}")
        except Exception as ex:
            print(f"Waiting for qBittorrent Web UI... ({ex})")
        time.sleep(1)
    print("Timed out waiting for qBittorrent Web UI.")
    return False

@app.route('/download', methods=['POST'])
def handle_download():
    global qb
    if qb is None:
        print("qBittorrent not connected. Attempting to launch and reconnect...")
        launch_qbittorrent()
        # Wait for Web UI to be ready before connecting
        if not wait_for_qbittorrent_webui(QB_HOST, QB_PORT, timeout=20):
            print("Web UI did not start in time. Aborting download.")
            return jsonify({'status': 'error', 'message': 'qBittorrent Web UI did not start in time.'}), 500
        try:
            qb = Client(
                host=f'http://{QB_HOST}:{QB_PORT}',
                username=QB_USERNAME,
                password=QB_PASSWORD
            )
            qb.auth_log_in()
            print("Successfully connected to qBittorrent Web UI after launching.")
        except Exception as e2:
            print(f"Still failed to connect to qBittorrent: {e2}")
            return jsonify({'status': 'error', 'message': 'qBittorrent connection not established.'}), 500

    data = request.json
    if not data or 'url' not in data:
        return jsonify({'status': 'error', 'message': 'Missing download URL'}), 400

    download_url = data['url']
    print(f"Received download request for: {download_url}")

    try:
        # Add the torrent
        result = qb.torrents_add(
            urls=download_url,
            save_path=QB_DOWNLOAD_LOCATION,
            is_paused=False
        )
        print(f"qBittorrent API result: {result}")  # Debug: print API result
        return jsonify({'status': 'success', 'message': 'Download started in qBittorrent', 'url': download_url})
    except Exception as e:
        print(f"Error adding torrent: {e}")
        import traceback; traceback.print_exc()
        print(f"Type of download_url: {type(download_url)}")
        print(f"Value of download_url: {download_url!r}")
        # Try to reconnect and add the torrent again if the Web UI was just launched
        if qb is not None:
            print("Retrying connection and torrent add after short wait...")
            time.sleep(3)
            try:
                qb.auth_log_in()
                result = qb.torrents_add(
                    urls=download_url,
                    save_path=QB_DOWNLOAD_LOCATION,
                    is_paused=False
                )
                print(f"qBittorrent API result (retry): {result}")
                return jsonify({'status': 'success', 'message': 'Download started in qBittorrent (after retry)', 'url': download_url})
            except Exception as e3:
                print(f"Retry failed: {e3}")
        return jsonify({'status': 'error', 'message': f'Failed to add torrent to qBittorrent: {e}'}), 500

@app.route('/')
def index():
    # Return a simple JSX-like string
    return '<div><h1>Server</h1></div>'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)