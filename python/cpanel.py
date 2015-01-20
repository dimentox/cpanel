import sys, os, socket, json, pprint
class LiveAPI(object):
    """Cpanel Live api"""
    connected = False
    s = None
    _result = None

    def __init__(self):
        self.connected = True
        sockfile = os.environ['CPANEL_CONNECT_SOCKET']
        if not sockfile:
            raise RuntimeError('There was a problem fetching the env variable containing the path to the socket')
        try:
            self.s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        except socket.error, msg:
            self.s = None
        try:
            self.s.connect(sockfile)
        except socket.error, msg:
            self.connected = False
            raise
        self.s.setblocking(1)
        self.cpexec('<cpaneljson enable="1">')
       
    def cpexec(self, code, skip_return = False):
        if not self.connected:
            raise RuntimeError("The LiveAPI socket has closed, unable to continue")
        buffer = ""
        result = ""
        self.s.send(`len(code)` + "\n" + code)
       
       
        while True:
            buffer += self.s.recv(1024)
            pos = buffer.find("</cpanelresult>")
            if (pos != -1):
                break
        if skip_return:
            self._result = None
            return
        
        jsonstart = buffer.find("<cpanelresult>{")
        jsonend = buffer.find("</cpanelresult>")
        if jsonstart != -1 and jsonend != -1:
            jsonstart +=14
            parsed = None
            try:
                parsed = buffer[jsonstart:jsonend]
            except:
                parsed = None
            if buffer.find('<cpanelresult>{"cpanelresult"') == -1 and parsed is not None:
                jsonParsed = json.loads(parsed)
                self._result = {}
                self._result[u'cpanelresult'] = jsonParsed
            else:
                jsonParsed = json.loads(parsed)
                self._result = {}
                self._result = jsonParsed
        elif buffer.find("<cpanelresult></cpanelresult>") != -1:
             self._result = {'cpanelresult':{'error':'Error cannot be propagated to liveapi, please check the cPanel error_log', 'result':{'errors':['Error cannot be propagated to liveapi, please check the cPanel error_log.']}}}
        elif buffer.find("<cpanelresult>") != -1:
            #xml response un supported
            self._result = {'cpanelresult':{'error':'Error cannot be propagated to liveapi, please check the cPanel error_log', 'result':{'errors':['Error cannot be propagated to liveapi, please check the cPanel error_log.']}}}
            
        return self._result

    def api(self, reqtype, version, module, func, args = {}):
        if not self.connected:
            raise RuntimeError("The LiveAPI socket has closed, unable to continue.")
        input = {"module": module, "reqtype" : reqtype, "func": func, "apiversion":version}
        if len(args) > 0:
            input["args"] = args
        code = "<cpanelaction>\n" + json.dumps(input) + "\n</cpanelaction>"
        return self.cpexec(code);

    def api1(self, module, func, args = {}):
        if not self.connected:
            raise RuntimeError("The LiveAPI socket has closed, unable to continue.")
        return self.api("exec", "1", module, func, args)

    def api2(self, module, func, args = {}):
        if not self.connected:
            raise RuntimeError("The LiveAPI socket has closed, unable to continue.")
        return self.api("exec", "2", module, func, args)

    def api3(self, module, func, args = {}):
        if not self.connected:
            raise RuntimeError("The LiveAPI socket has closed, unable to continue.")
        return self.api("exec", "3", module, func, args)

    def uapi(self, module, func, args = {}):
        if not self.connected:
            raise RuntimeError("The LiveAPI socket has closed, unable to continue.")
        return self.api("exec", "uapi", module, func, args)

    def fetch(self, var):
        if not self.connected:
            raise RuntimeError("The LiveAPI socket has closed, unable to continue.")
        return self.cpexec('<cpanel print="' + var + '">')

    def cpanelif(self, code):
        if not self.connected:
            raise RuntimeError("The LiveAPI socket has closed, unable to continue.")
        return self.cpexec('<cpanel print="' + code + '">')

    def cpanelfeature(self,feature):
        if not self.connected:
            raise RuntimeError("The LiveAPI socket has closed, unable to continue.")
        return self.simple_result(self.api('feature','','feature', 'feature', feature))

    def cpanelprint(self,var):
        if not self.connected:
            raise RuntimeError("The LiveAPI socket has closed, unable to continue.")
        return self.simple_result(self.api1('print','',var))

    def cpanellangprint(self, key):
        if not self.connected:
            raise RuntimeError("The LiveAPI socket has closed, unable to continue.")
        return self.simple_result(self.api1('langprint','',key))

    def end(self):
        if not self.connected:
            raise RuntimeError("The LiveAPI socket has closed, unable to continue.")
        self.cpexec('<cpanelxml shutdown="1" />', True)
        self.s.close()

   
    def simple_result(self, result_data):
        return result_data['cpanelresult']['data']['result']