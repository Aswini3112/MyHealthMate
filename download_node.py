import urllib.request
import zipfile
import io
import os

url = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-win-x64.zip"
dest_dir = "d:\\Hack2\\node"

print(f"Downloading Node.js from {url}...")
try:
    with urllib.request.urlopen(url) as response:
        file_size = int(response.headers.get('Content-Length', 0))
        print(f"File size: {file_size / (1024*1024):.2f} MB")
        
        data = response.read()
        print("Download complete. Unzipping...")
        
        with zipfile.ZipFile(io.BytesIO(data)) as zip_ref:
            # The zip contains a folder node-v20.11.1-win-x64, let's extract it
            zip_ref.extractall("d:\\Hack2")
            
        # Rename the extracted folder to 'node'
        extracted_folder = "d:\\Hack2\\node-v20.11.1-win-x64"
        if os.path.exists(extracted_folder):
            if os.path.exists(dest_dir):
                import shutil
                shutil.rmtree(dest_dir)
            os.rename(extracted_folder, dest_dir)
            print("Node.js setup successful in d:\\Hack2\\node!")
        else:
            print("Extraction folder not found, check workspace contents.")
except Exception as e:
    print(f"Error occurred: {e}")
