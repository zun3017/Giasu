        const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzCukYOmHXbOLkyiNIE02P5E3UOVFtU5nlf7K7OMYD6NXxE_e_L7GZAMaF81ZjLtRo2/exec';

        // Chỉ tạo Shim giả lập nếu chạy ngoài môi trường Google Apps Script (ví dụ trên GitHub Pages)
        if (typeof google === 'undefined' || typeof google.script === 'undefined' || typeof google.script.run === 'undefined') {
            console.log('Chạy ngoài môi trường Google Apps Script. Kích hoạt API Gateway Shim...');
            
            class GoogleScriptRunInstance {
                constructor() {
                    this._successHandler = null;
                    this._failureHandler = null;
                    
                    return new Proxy(this, {
                        get: (target, prop) => {
                            if (prop in target) {
                                return target[prop];
                            }
                            return (...args) => {
                                return target._execute(prop, args);
                            };
                        }
                    });
                }
                
                withSuccessHandler(callback) {
                    this._successHandler = callback;
                    return this;
                }
                
                withFailureHandler(callback) {
                    this._failureHandler = callback;
                    return this;
                }
                
                _execute(functionName, args) {
                    if (SCRIPT_URL.indexOf('YOUR_SCRIPT_ID') !== -1 || SCRIPT_URL.trim() === '') {
                        const errMsg = 'Hệ thống chưa được cấu hình URL kết nối Google Sheets.';
                        if (this._failureHandler) {
                            this._failureHandler(errMsg);
                        } else {
                            alert(errMsg);
                        }
                        var loading = document.getElementById('loadingText');
                        if (loading) loading.style.display = 'none';
                        return;
                    }
                    
                    // Sử dụng Content-Type text/plain để tránh CORS preflight OPTIONS request
                    fetch(SCRIPT_URL, {
                        method: 'POST',
                        mode: 'cors',
                        headers: {
                            'Content-Type': 'text/plain;charset=utf-8'
                        },
                        body: JSON.stringify({
                            functionName: functionName,
                            arguments: args
                        })
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Mã phản hồi HTTP lỗi: ' + response.status);
                        }
                        return response.json();
                    })
                    .then(data => {
                        let resData = (data && data.result !== undefined) ? data.result : data;
                        if (data && data.error && data.result === undefined) {
                            if (this._failureHandler) {
                                this._failureHandler(data.error);
                            } else if (this._successHandler) {
                                this._successHandler({ error: data.error });
                            }
                        } else {
                            if (this._successHandler) {
                                this._successHandler(resData);
                            }
                        }
                    })
                    .catch(error => {
                        if (this._failureHandler) {
                            this._failureHandler('Lỗi kết nối máy chủ Google: ' + error.message);
                        } else {
                            console.error('Lỗi kết nối API:', error);
                        }
                    });
                }
            }
            
            window.google = window.google || {};
            window.google.script = window.google.script || {};
            Object.defineProperty(window.google.script, 'run', {
                get: () => new GoogleScriptRunInstance()
            });
        }

        // Chuẩn hóa số điện thoại ở phía client để so khớp chính xác
        function normalizePhone(p) {
            if (!p) return "";
            var clean = String(p).replace(/\D/g, "");
            if (clean.length > 1 && clean.charAt(0) === '0') {
                clean = clean.substring(1);
            }
            return clean;
        }
