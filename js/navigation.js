        // Hàm chuyển đổi link Google Drive sang link ảnh trực tiếp
        function convertDriveLink(url) {
            if (!url) return "";
            var match = url.match(/\/d\/(.*?)\//);
            if (match && match[1]) return "https://drive.google.com/uc?export=view&id=" + match[1];
            match = url.match(/id=(.*?)&/);
            if (match && match[1]) return "https://drive.google.com/uc?export=view&id=" + match[1];
            match = url.match(/id=([^&]*)/);
            if (match && match[1]) return "https://drive.google.com/uc?export=view&id=" + match[1];
            return url;
        }

        var currentChartInstance = null;
        var tutorChartInstance = null;
        var currentStudentName = "";
        
        var tutorDataGlobal = null;
        var currentTutorStudent = null;
        var currentTutorPhone = "";
        
        var adminDataGlobal = null;
        var currentAdminPhone = "";
        var currentAdminTab = "report";
        var adminRevenueChartInstance = null;
        var pinVerifyAction = "deleteStudent";

        function navigateToPage(pageName) {
            // Hide all sections
            document.getElementById('sectionHome').style.display = 'none';
            document.getElementById('sectionStudentLogin').style.display = 'none';
            document.getElementById('sectionTutorLogin').style.display = 'none';
            
            // Deactivate all nav buttons
            document.getElementById('btnNavHome').classList.remove('active');
            document.getElementById('btnNavStudent').classList.remove('active');
            document.getElementById('btnNavTutor').classList.remove('active');
            
            // Show target section and activate target button
            if (pageName === 'student') {
                document.getElementById('sectionStudentLogin').style.display = 'flex';
                document.getElementById('btnNavStudent').classList.add('active');
            } else if (pageName === 'tutor') {
                document.getElementById('sectionTutorLogin').style.display = 'flex';
                document.getElementById('btnNavTutor').classList.add('active');
            } else {
                document.getElementById('sectionHome').style.display = 'flex';
                document.getElementById('btnNavHome').classList.add('active');
            }
        }

        function xuLyTraCuu(role) {
            var phone = "";
            var pin = "";
            var loiHienThi = null;
            var loadingText = null;
            
            if (role === 'tutor') {
                phone = document.getElementById('tutorPhone').value.trim();
                pin = document.getElementById('tutorPin').value.trim();
                loiHienThi = document.getElementById('tutorThongBaoLoi');
                loadingText = document.getElementById('tutorLoadingText');
            } else {
                phone = document.getElementById('maHocSinh').value.trim();
                pin = "";
                loiHienThi = document.getElementById('thongBaoLoi');
                loadingText = document.getElementById('loadingText');
            }
            
            if (phone === "") {
                loiHienThi.innerText = "Vui lòng nhập số điện thoại để tiếp tục!";
                loiHienThi.style.display = "block";
                return;
            }
            
            if (role === 'tutor' && pin === "") {
                loiHienThi.innerText = "Vui lòng nhập mã PIN gia sư!";
                loiHienThi.style.display = "block";
                return;
            }
            
            // Copy to hidden legacy storage inputs for backward compatibility if present
            var legacyHS = document.getElementById('maHocSinh');
            if (legacyHS) legacyHS.value = phone;
            var legacyPin = document.getElementById('maPin');
            if (legacyPin) legacyPin.value = pin;
            
            loiHienThi.style.display = "none";
            loadingText.style.display = 'block';
            
            google.script.run.withSuccessHandler(function(ketQua) {
                hienThiKetQua(ketQua, role, phone, pin);
            }).loginSystem(phone, pin);
        }

        function isSinglePageApp() {
            return (document.getElementById('tutorDashboardBox') !== null);
        }

        function hienThiKetQua(ketQua, role, phone, pin) {
            var loadingStudent = document.getElementById('loadingText');
            var loadingTutor = document.getElementById('tutorLoadingText');
            if (loadingStudent) loadingStudent.style.display = 'none';
            if (loadingTutor) loadingTutor.style.display = 'none';
            
            var loiHienThi = (role === 'tutor') ? document.getElementById('tutorThongBaoLoi') : document.getElementById('thongBaoLoi');
            
            if (ketQua.error) {
                loiHienThi.innerText = ketQua.error;
                loiHienThi.style.display = "block";
                return;
            }
            
            if (ketQua.requiresPin) {
                if (role !== 'tutor') {
                    loiHienThi.innerHTML = "Số điện thoại này thuộc tài khoản Gia sư / Admin.<br>Vui lòng chọn mục <b>'Dành cho Gia sư'</b> ở thanh menu để đăng nhập.";
                    loiHienThi.style.display = "block";
                } else {
                    loiHienThi.innerText = "Yêu cầu nhập mã PIN chính xác.";
                    loiHienThi.style.display = "block";
                }
                return;
            }
            
            if (ketQua.role === 'student') {
                if (role === 'tutor') {
                    loiHienThi.innerHTML = "Số điện thoại này thuộc tài khoản Học sinh / Phụ huynh.<br>Vui lòng chọn mục <b>'Dành cho PH / HS'</b> ở thanh menu để đăng nhập.";
                    loiHienThi.style.display = "block";
                    return;
                }
                
                if (ketQua.multipleStudents && ketQua.childrenList) {
                    hienThiTheChonCon(ketQua.childrenList, phone);
                    return;
                }
            }

            if (ketQua.role === 'student' && ketQua.data && ketQua.data.timThay) {
                sessionStorage.setItem('userRole', 'student');
                sessionStorage.setItem('userPhone', phone);
                sessionStorage.setItem('userPin', '');
                sessionStorage.setItem('dashboardData', JSON.stringify(ketQua.data));

                localStorage.setItem('userRole', 'student');
                localStorage.setItem('userPhone', phone);
                localStorage.setItem('selectedStudentName', ketQua.data.tenHocSinh || '');
                localStorage.setItem('dashboardData', JSON.stringify(ketQua.data));

                if (isSinglePageApp()) {
                    var mainScr = document.getElementById('mainScreen');
                    if (mainScr) mainScr.style.display = 'none';
                    var resultBx = document.getElementById('resultBox');
                    if (resultBx) resultBx.style.display = 'block';
                    
                    // Hide other potential dashboard containers
                    var tutorDb = document.getElementById('tutorDashboardBox');
                    if (tutorDb) tutorDb.style.display = 'none';
                    var adminDb = document.getElementById('adminDashboardBox');
                    if (adminDb) adminDb.style.display = 'none';
                    
                    renderStudentView(ketQua.data);
                } else {
                    window.location.href = 'student-dashboard.html';
                }
            } else if (ketQua.role === 'tutor') {
                sessionStorage.setItem('userRole', 'tutor');
                sessionStorage.setItem('userPhone', phone);
                sessionStorage.setItem('userPin', pin);
                sessionStorage.setItem('dashboardData', JSON.stringify(ketQua.data));
                if (isSinglePageApp()) {
                    var mainScr = document.getElementById('mainScreen');
                    if (mainScr) mainScr.style.display = 'none';
                    var tutorDb = document.getElementById('tutorDashboardBox');
                    if (tutorDb) tutorDb.style.display = 'block';
                    
                    // Hide other potential dashboard containers
                    var resultBx = document.getElementById('resultBox');
                    if (resultBx) resultBx.style.display = 'none';
                    var adminDb = document.getElementById('adminDashboardBox');
                    if (adminDb) adminDb.style.display = 'none';
                    
                    renderTutorView(ketQua.data);
                } else {
                    window.location.href = 'tutor-dashboard.html';
                }
            } else if (ketQua.role === 'admin') {
                sessionStorage.setItem('userRole', 'admin');
                sessionStorage.setItem('userPhone', phone);
                sessionStorage.setItem('userPin', pin);
                sessionStorage.setItem('dashboardData', JSON.stringify(ketQua.data));
                if (isSinglePageApp()) {
                    var mainScr = document.getElementById('mainScreen');
                    if (mainScr) mainScr.style.display = 'none';
                    var adminDb = document.getElementById('adminDashboardBox');
                    if (adminDb) adminDb.style.display = 'block';
                    
                    // Hide other potential dashboard containers
                    var resultBx = document.getElementById('resultBox');
                    if (resultBx) resultBx.style.display = 'none';
                    var tutorDb = document.getElementById('tutorDashboardBox');
                    if (tutorDb) tutorDb.style.display = 'none';
                    
                    renderAdminView(ketQua.data);
                } else {
                    window.location.href = 'admin-dashboard.html';
                }
            }
        }

        function hienThiTheChonCon(childrenList, phone) {
            var modal = document.getElementById('childSelectorModal');
            var container = document.getElementById('childrenBtnContainer');
            if (!modal || !container) {
                // Inline fallback if modal element is missing in DOM
                var names = childrenList.map(function(c) { return c.name; }).join(', ');
                alert('Tìm thấy các học sinh: ' + names + '. Vui lòng chọn con.');
                return;
            }
            
            container.innerHTML = '';
            childrenList.forEach(function(child) {
                var btn = document.createElement('button');
                btn.className = 'btn-child-select';
                btn.style.cssText = 'width: 100%; padding: 14px 20px; margin-bottom: 10px; background: linear-gradient(135deg, #8E4DFF, #5B2EFF); border: none; border-radius: 14px; color: #FFF; font-weight: 700; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s ease; box-shadow: 0 4px 15px rgba(142,77,255,0.3);';
                btn.innerHTML = '<span><i class="fa-solid fa-user-graduate" style="margin-right:10px; color:#FFD23F;"></i>' + child.name + '</span> <i class="fa-solid fa-chevron-right" style="font-size:12px; opacity:0.8;"></i>';
                btn.onclick = function() {
                    chonConVaDangNhap(phone, child.name);
                };
                container.appendChild(btn);
            });
            
            modal.style.display = 'flex';
        }

        function chonConVaDangNhap(phone, childName) {
            var modal = document.getElementById('childSelectorModal');
            if (modal) modal.style.display = 'none';
            var loadingText = document.getElementById('loadingText');
            if (loadingText) loadingText.style.display = 'block';
            
            google.script.run.withSuccessHandler(function(ketQua) {
                hienThiKetQua(ketQua, 'student', phone, '');
            }).loginSystem(phone, '', childName);
        }
        
