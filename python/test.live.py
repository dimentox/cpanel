import sys, os, socket, cpanel, pprint,json, cgi, cgitb 

print "Content-type: text/plain\n\n"
form = cgi.FieldStorage()
pprint.pprint(form)
headers = form.headers
pprint.pprint(headers['content-type'])
pprint.pprint(json.loads(form.value))

api = cpanel.LiveAPI()

data = api.api2("CustInfo", "displaycontactinfo")
pprint.pprint(data)

pprint.pprint(api.api1("NVData", "set", ['bob','blahh2']))

pprint.pprint(api.cpanelprint("$NVDATA{'bob'}"))

pprint.pprint(api.api2("NVData", "set", {"names":"bob2", "bob2": "test"}))

pprint.pprint(api.cpanelprint("$NVDATA{'bob2'}"))


