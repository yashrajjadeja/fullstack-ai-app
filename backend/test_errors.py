import http.client, json

CRLF = b"\r\n"
boundary = b"boundary123"

def make_body(name, filename, content_type, data):
    return (
        b"--" + boundary + CRLF +
        b"Content-Disposition: form-data; name=\"" + name + b"\"; filename=\"" + filename + b"\"" + CRLF +
        b"Content-Type: " + content_type + CRLF + CRLF +
        data + CRLF +
        b"--" + boundary + b"--" + CRLF
    )

def post(path, body, ct):
    conn = http.client.HTTPConnection("127.0.0.1", 5000)
    conn.request("POST", path, body, {"Content-Type": ct})
    r = conn.getresponse()
    return r.status, json.loads(r.read())

# Test 1: no file at all
conn = http.client.HTTPConnection("127.0.0.1", 5000)
conn.request("POST", "/api/classify", b"--boundary123--\r\n",
             {"Content-Type": "multipart/form-data; boundary=boundary123"})
r = conn.getresponse()
print("Test 1 (no image field):", r.status, json.loads(r.read()))

# Test 2: wrong MIME type (text/plain)
body = make_body(b"image", b"fake.png", b"text/plain", b"not an image")
ct = "multipart/form-data; boundary=boundary123"
print("Test 2 (wrong MIME):", *post("/api/classify", body, ct))

# Test 3: right MIME but bad content (corrupted PNG)
body = make_body(b"image", b"fake.png", b"image/png", b"this is not a real png")
print("Test 3 (bad image data):", *post("/api/classify", body, ct))

# Test 4: missing text on sentiment
conn2 = http.client.HTTPConnection("127.0.0.1", 5000)
conn2.request("POST", "/api/sentiment", b"{}", {"Content-Type": "application/json"})
r2 = conn2.getresponse()
print("Test 4 (empty sentiment):", r2.status, json.loads(r2.read()))
