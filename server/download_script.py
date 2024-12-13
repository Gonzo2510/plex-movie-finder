import requests
import sys
import subprocess

# Function to get the current public IP address
def get_current_ip():
    response = requests.get('https://api.ipify.org')
    return response.text

# Function to check if connected to PIA VPN
def is_connected_to_pia(vpn_ip):
    current_ip = get_current_ip()
    return current_ip == vpn_ip

# Main function
if __name__ == '__main__':
    # Replace with your PIA VPN IP address
    pia_vpn_ip = 'YOUR_PIA_VPN_IP_ADDRESS'

    if not is_connected_to_pia(pia_vpn_ip):
        print("You are not connected to the PIA VPN. Please connect and try again.")
        # Optionally, you can add code here to attempt to connect to the VPN
        sys.exit(1)

    # Proceed with downloading the torrent
    torrent_url = sys.argv[1]
    subprocess.run(['aria2c', torrent_url])  # Adjust this command based on your download tool