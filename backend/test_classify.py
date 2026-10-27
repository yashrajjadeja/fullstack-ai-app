import struct, zlib, http.client

def chunk(name, data):
    c = name + data
    return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)

sig = b"\x89PNG\r\n\x1a\n"
ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 2, 0, 0, 0))
raw = bytes([0, 200, 50, 30])   # filter byte + R G B for a red pixel
idat = chunk(b"IDAT", zlib.compress(raw))
iend = chunk(b"IEND", b"")
png = sig + ihdr + idat + iend

boundary = "boundary123"
CRLF = b"\r\n"
body = (
    b"--" + boundary.encode() + CRLF +
    b'Content-Disposition: form-data; name="image"; filename="test.png"' + CRLF +
    b"Content-Type: image/png" + CRLF + CRLF +
    png + CRLF +
    b"--" + boundary.encode() + b"--" + CRLF
)

conn = http.client.HTTPConnection("127.0.0.1", 5000)
conn.request("POST", "/api/classify", body,
             {"Content-Type": "multipart/form-data; boundary=" + boundary})
resp = conn.getresponse()
print("Status:", resp.status)
print("Body:", resp.read().decode())
