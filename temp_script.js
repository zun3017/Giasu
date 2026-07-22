
        var currentTutorData = null;
        var currentClasses = [];
        var activeClassIndex = -1;
        var activeStudents = [];
        var activeClassLessonLogs = [];

        var activeClassHomework = [];

        function showSyncToast(state) {
            var toast = document.getElementById('syncToast');
            if (!toast) return;
            toast.className = 'sync-toast ' + state;
            if (state === 'pending') {
                toast.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Đang đồng bộ...';
                toast.style.display = 'flex';
            } else if (state === 'success') {
                toast.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã đồng bộ';
                toast.style.display = 'flex';
                setTimeout(function() { toast.style.display = 'none'; }, 2500);
            } else if (state === 'error') {
                toast.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Lỗi đồng bộ!';
                toast.style.display = 'flex';
                setTimeout(function() { toast.style.display = 'none'; }, 4000);
            }
        }

        function showCustomConfirm(message, callback) {
            var modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.background = 'rgba(3, 8, 29, 0.8)';
            modal.style.backdropFilter = 'blur(8px)';
            modal.style.webkitBackdropFilter = 'blur(8px)';
            modal.style.zIndex = '99999';
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            modal.style.fontFamily = "'Inter', sans-serif";
            
            var box = document.createElement('div');
            box.style.background = 'rgba(11, 8, 38, 0.95)';
            box.style.border = '1px solid rgba(142, 77, 255, 0.3)';
            box.style.borderRadius = '16px';
            box.style.padding = '30px';
            box.style.maxWidth = '400px';
            box.style.width = '90%';
            box.style.textAlign = 'center';
            box.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)';
            box.style.transform = 'scale(0.8)';
            box.style.opacity = '0';
            box.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            box.innerHTML = 
                '<div style="font-size: 44px; color: #FFD23F; margin-bottom: 15px;"><i class="fa-solid fa-circle-question"></i></div>' +
                '<h4 style="color: #FFF; margin: 0 0 10px; font-size: 18px; font-weight: 700;">Xác nhận</h4>' +
                '<p style="color: #A6ADCE; font-size: 14px; margin: 0 0 24px; line-height: 1.5; text-align: center;">' + message + '</p>' +
                '<div style="display: flex; gap: 12px; justify-content: center;">' +
                    '<button id="confirmCancelBtn" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #A6ADCE; padding: 10px 24px; border-radius: 20px; font-size: 13px; font-weight:600; cursor: pointer; transition: all 0.3s; outline: none; border-style: solid;">Hủy</button>' +
                    '<button id="confirmOkBtn" style="background: linear-gradient(135deg, #8E4DFF 0%, #5B21B6 100%); border: none; color: #FFF; padding: 10px 24px; border-radius: 20px; font-size: 13px; font-weight:600; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 10px rgba(142, 77, 255, 0.2); outline: none;">Đồng ý</button>' +
                '</div>';
                
            modal.appendChild(box);
            document.body.appendChild(modal);
            box.offsetHeight; // force reflow
            
            box.style.transform = 'scale(1)';
            box.style.opacity = '1';
            
            var cancelBtn = box.querySelector('#confirmCancelBtn');
            var okBtn = box.querySelector('#confirmOkBtn');
            
            cancelBtn.onmouseenter = () => cancelBtn.style.background = 'rgba(255,255,255,0.1)';
            cancelBtn.onmouseleave = () => cancelBtn.style.background = 'rgba(255,255,255,0.05)';
            okBtn.onmouseenter = () => okBtn.style.transform = 'translateY(-2px)';
            okBtn.onmouseleave = () => okBtn.style.transform = 'translateY(0)';
            
            var closeConfirm = function(result) {
                box.style.transform = 'scale(0.8)';
                box.style.opacity = '0';
                modal.style.opacity = '0';
                modal.style.transition = 'opacity 0.3s ease';
                setTimeout(function() {
                    modal.remove();
                    if (result && callback) callback();
                }, 300);
            };
            
            cancelBtn.onclick = () => closeConfirm(false);
            okBtn.onclick = () => closeConfirm(true);
        }

        function showToast(message, type) {
            if (!type) type = 'info';
            var container = document.getElementById('toastContainer');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toastContainer';
                container.style.position = 'fixed';
                container.style.top = '25px';
                container.style.right = '25px';
                container.style.zIndex = '999999';
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.gap = '10px';
                container.style.pointerEvents = 'none';
                document.body.appendChild(container);
            }
            
            var toast = document.createElement('div');
            toast.style.padding = '14px 24px';
            toast.style.borderRadius = '14px';
            toast.style.color = '#FFF';
            toast.style.fontSize = '14px';
            toast.style.fontWeight = '600';
            toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
            toast.style.pointerEvents = 'auto';
            toast.style.fontFamily = "'Inter', sans-serif";
            toast.style.display = 'flex';
            toast.style.alignItems = 'center';
            toast.style.gap = '10px';
            toast.style.borderWidth = '1px';
            toast.style.borderStyle = 'solid';
            toast.style.backdropFilter = 'blur(15px)';
            toast.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            toast.style.transform = 'translateX(120%)';
            toast.style.opacity = '0';
            
            if (type === 'success') {
                toast.style.background = 'rgba(16, 185, 129, 0.95)';
                toast.style.borderColor = '#10B981';
                toast.innerHTML = '<i class="fa-solid fa-circle-check" style="font-size: 16px;"></i> ' + message;
            } else if (type === 'error') {
                toast.style.background = 'rgba(239, 68, 68, 0.95)';
                toast.style.borderColor = '#EF4444';
                toast.innerHTML = '<i class="fa-solid fa-circle-xmark" style="font-size: 16px;"></i> ' + message;
            } else {
                toast.style.background = 'rgba(142, 77, 255, 0.95)';
                toast.style.borderColor = '#8E4DFF';
                toast.innerHTML = '<i class="fa-solid fa-circle-info" style="font-size: 16px;"></i> ' + message;
            }
            
            container.appendChild(toast);
            toast.offsetHeight; // force reflow
            
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
            
            setTimeout(function() {
                toast.style.transform = 'translateX(120%)';
                toast.style.opacity = '0';
                setTimeout(function() {
                    toast.remove();
                }, 300);
            }, 3200);
        }

        document.addEventListener("DOMContentLoaded", function() {

            // Đọc dữ liệu giáo viên từ sessionStorage hoặc localStorage
            var saved = sessionStorage.getItem("classTutorData") || sessionStorage.getItem("userTutorData") || localStorage.getItem("classTutorData") || localStorage.getItem("userTutorData");
            
            if (saved) {
                try {
                    currentTutorData = JSON.parse(saved);
                    var nameDisplay = document.getElementById("tutorNameDisplay");
                    if (nameDisplay) {
                        nameDisplay.innerText = "Xin chào, " + (currentTutorData.tutorName || "Giáo viên Lớp học") + " 👋";
                    }

                    if (currentTutorData.classes && Array.isArray(currentTutorData.classes) && currentTutorData.classes.length > 0) {
                        currentClasses = currentTutorData.classes;
                        renderDashboardUI();
                    }

                    var phone = currentTutorData.tutorPhone || sessionStorage.getItem("userPhone") || localStorage.getItem("userPhone") || "";
                    var code = currentTutorData.tutorCode || currentTutorData.tutorId || sessionStorage.getItem("userCode") || localStorage.getItem("userCode") || "";
                    loadClassDashboardData(phone, null, code);
                } catch(e) {
                    console.error("Lỗi parse data giáo viên:", e);
                    loadClassDashboardData("", null, "");
                }
            } else {
                currentTutorData = { tutorName: "Giáo viên Lớp học", tutorPhone: "", tutorCode: "" };
                loadClassDashboardData("", null, "");
            }
        });

        function loadClassDashboardData(phone, requestedClassId, code) {
            var tutorCode = code || (currentTutorData ? (currentTutorData.tutorCode || currentTutorData.tutorId || "") : "");
            google.script.run
                .withSuccessHandler(function(res) {
                    if (res && res.classes && Array.isArray(res.classes) && res.classes.length > 0) {
                        var merged = res.classes.slice();
                        if (currentClasses && currentClasses.length > 0) {
                            currentClasses.forEach(function(localCls) {
                                if (!merged.some(function(mc) { return mc.classId === localCls.classId || mc.className === localCls.className; })) {
                                    merged.push(localCls);
                                }
                            });
                        }
                        currentClasses = merged;
                        if (!currentTutorData) currentTutorData = {};
                        currentTutorData.classes = currentClasses;
                        if (phone) currentTutorData.tutorPhone = phone;
                        if (tutorCode) {
                            currentTutorData.tutorCode = tutorCode;
                            currentTutorData.tutorId = tutorCode;
                        }
                        sessionStorage.setItem("classTutorData", JSON.stringify(currentTutorData));
                        localStorage.setItem("classTutorData", JSON.stringify(currentTutorData));
                        
                        if (requestedClassId) {
                            activeClassIndex = currentClasses.findIndex(function(c) { return c.classId === requestedClassId; });
                        } else if (res.activeClass) {
                            activeClassIndex = currentClasses.findIndex(function(c) { return c.classId === res.activeClass.classId; });
                        }
                        if (activeClassIndex < 0 || activeClassIndex >= currentClasses.length) {
                            activeClassIndex = 0;
                        }

                        activeStudents = res.students || [];
                        activeClassLessonLogs = res.lessonLogs || [];
                        
                        var inputEl = document.getElementById("classQuickAnnouncementInput");
                        if (inputEl) inputEl.value = res.announcement || "";

                        activeClassHomework = res.homeworkList || [];

                        renderDashboardUI();
                    } else {
                        var savedData = sessionStorage.getItem("classTutorData") || localStorage.getItem("classTutorData");
                        if (savedData) {
                            try {
                                var parsed = JSON.parse(savedData);
                                if (parsed && parsed.classes && parsed.classes.length > 0) {
                                    currentClasses = parsed.classes;
                                    if (activeClassIndex < 0 || activeClassIndex >= currentClasses.length) activeClassIndex = 0;
                                    renderDashboardUI();
                                    return;
                                }
                            } catch(e) {}
                        }
                        renderEmptyClassState();
                    }
                })
                .withFailureHandler(function(err) {
                    console.error("Lỗi tải dữ liệu tổng lớp học:", err);
                    var savedData = sessionStorage.getItem("classTutorData") || localStorage.getItem("classTutorData");
                    if (savedData) {
                        try {
                            var parsed = JSON.parse(savedData);
                            if (parsed && parsed.classes && parsed.classes.length > 0) {
                                currentClasses = parsed.classes;
                                if (activeClassIndex < 0 || activeClassIndex >= currentClasses.length) activeClassIndex = 0;
                                renderDashboardUI();
                                return;
                            }
                        } catch(e) {}
                    }
                    renderEmptyClassState();
                })
                .getClassDashboardData(phone || "", requestedClassId, tutorCode);
        }

        function renderDashboardUI() {
            var cls = currentClasses[activeClassIndex];
            if (!cls) {
                renderEmptyClassState();
                return;
            }
            var container = document.getElementById("classDetailsContainer");
            if (container) {
                container.style.display = "block";
            }

            document.getElementById("activeClassName").innerText = cls.className;
            document.getElementById("activeClassSubject").innerText = cls.subject || "Chưa cập nhật";
            document.getElementById("activeClassSchedule").innerText = cls.schedule || "Chưa cập nhật";

            renderClassNavRow();
            renderRosterAndEvalGrid();
            renderClassLessonLogsTableUI();
            renderClassHomeworkListUI();
        }

        function openTutorAccountModal() {
            var nameEl = document.getElementById("accTutorName");
            var phoneEl = document.getElementById("accTutorPhone");
            var pinEl = document.getElementById("accTutorPin");
            var classCountEl = document.getElementById("accClassCount");
            var unpaidEl = document.getElementById("accUnpaidIncome");
            var qrImg = document.getElementById("accQrImg");
            var qrText = document.getElementById("accQrText");

            if (nameEl) nameEl.value = currentTutorData ? (currentTutorData.tutorName || "Giáo viên Lớp học") : "";
            if (phoneEl) phoneEl.value = currentTutorData ? (currentTutorData.tutorPhone || "") : "";
            if (pinEl) pinEl.value = currentTutorData ? (currentTutorData.tutorPin || currentTutorData.pin || "") : "";
            if (classCountEl) classCountEl.value = (currentClasses ? currentClasses.length : 0) + " lớp";

            var totalUnpaid = 0;
            if (activeClassLessonLogs && activeStudents) {
                activeClassLessonLogs.forEach(function(log) {
                    var sNotes = log.studentNotes || {};
                    activeStudents.forEach(function(st) {
                        var pInfo = sNotes[st.studentId] || {};
                        var att = pInfo.attendance || "Có mặt";
                        if (log.status === "Cả lớp nghỉ") att = "Cả lớp nghỉ";
                        if ((att === "Có mặt" || att === "Đi muộn") && !(pInfo.paid === true || pInfo.paid === "true")) {
                            var fee = parseInt(st.fee) || 0;
                            totalUnpaid += fee;
                        }
                    });
                });
            }
            if (unpaidEl) unpaidEl.value = totalUnpaid.toLocaleString('vi-VN') + " VNĐ";

            var qrUrl = currentTutorData ? (currentTutorData.qrUrl || currentTutorData.qrCodeUrl || "") : "";
            if (qrUrl && qrImg) {
                qrImg.src = qrUrl;
                qrImg.style.display = "block";
                if (qrText) qrText.style.display = "none";
            } else if (qrImg) {
                qrImg.style.display = "none";
                if (qrText) qrText.style.display = "block";
            }

            openModal("tutorAccountModal");
        }

        function saveClassTutorAccount(btn) {
            var name = document.getElementById("accTutorName").value.trim();
            var phone = document.getElementById("accTutorPhone").value.trim();
            var pin = document.getElementById("accTutorPin").value.trim();

            if (!name || !phone) {
                showToast("Vui lòng nhập đầy đủ Họ tên và Số điện thoại!", "error");
                return;
            }

            var saveBtn = btn || document.getElementById("btnSaveClassTutorAccount");
            var originalBtnHtml = "";
            if (saveBtn) {
                saveBtn.disabled = true;
                originalBtnHtml = saveBtn.innerHTML;
                saveBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...';
            }

            if (!currentTutorData) currentTutorData = {};
            currentTutorData.tutorName = name;
            currentTutorData.tutorPhone = phone;
            currentTutorData.tutorPin = pin;

            sessionStorage.setItem("classTutorData", JSON.stringify(currentTutorData));
            localStorage.setItem("classTutorData", JSON.stringify(currentTutorData));

            var nameDisplay = document.getElementById("tutorNameDisplay");
            if (nameDisplay) nameDisplay.innerText = "Xin chào, " + name + " 👋";

            showSyncToast('pending');
            google.script.run
                .withSuccessHandler(function() {
                    showSyncToast('success');
                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.innerHTML = originalBtnHtml;
                    }
                    closeModal("tutorAccountModal");
                })
                .withFailureHandler(function(err) {
                    showSyncToast('error');
                    if (saveBtn) {
                        saveBtn.disabled = false;
                        saveBtn.innerHTML = originalBtnHtml;
                    }
                    console.error("Lỗi cập nhật tài khoản:", err);
                })
                .updateTutorAccountInfo(phone, name, pin);
        }

        function renderEmptyClassState() {
            activeClassIndex = -1;
            var details = document.getElementById("classDetailsContainer");
            if (details) details.style.display = "none";

            renderClassNavRow();
        }

        function renderClassNavRow() {
            var row = document.getElementById("classNavRow");
            if (!row) return;
            row.innerHTML = "";

            if (currentClasses && currentClasses.length > 0) {
                currentClasses.forEach(function(cls, idx) {
                    var btn = document.createElement("button");
                    btn.className = "class-btn " + (idx === activeClassIndex ? "active" : "");
                    btn.innerText = cls.className;
                    btn.onclick = function() { selectClass(idx); };
                    row.appendChild(btn);
                });
            } else {
                var emptySpan = document.createElement("span");
                emptySpan.style.color = "#A6ADCE";
                emptySpan.style.fontSize = "13.5px";
                emptySpan.style.fontStyle = "italic";
                emptySpan.style.marginRight = "10px";
                emptySpan.innerText = "Chưa có lớp học nào. Bấm nút bên dưới để tạo lớp mới!";
                row.appendChild(emptySpan);
            }

            // Nút Thêm Lớp
            var addBtn = document.createElement("button");
            addBtn.className = "btn-add-class";
            addBtn.style.padding = "8px 16px";
            addBtn.style.borderRadius = "20px";
            addBtn.style.fontWeight = "bold";
            addBtn.style.cursor = "pointer";
            addBtn.innerHTML = '<i class="fa-solid fa-plus" style="margin-right: 6px;"></i>Thêm lớp học';
            addBtn.onclick = function() { openModal("addClassModal"); };
            row.appendChild(addBtn);

            if (currentClasses && currentClasses.length > 0) {
                // Nút Sửa Lớp
                var editBtn = document.createElement("button");
                editBtn.className = "btn-add-class";
                editBtn.style.background = "rgba(142, 77, 255, 0.15)";
                editBtn.style.borderColor = "rgba(142, 77, 255, 0.4)";
                editBtn.style.color = "#E2D1FF";
                editBtn.style.padding = "8px 16px";
                editBtn.style.borderRadius = "20px";
                editBtn.style.fontWeight = "600";
                editBtn.style.cursor = "pointer";
                editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square" style="margin-right: 6px;"></i>Sửa lớp';
                editBtn.onclick = function() { openEditClassModal(); };
                row.appendChild(editBtn);

                // Nút Xóa Lớp
                var delBtn = document.createElement("button");
                delBtn.className = "btn-delete-class";
                delBtn.title = "Xóa lớp học hiện tại";
                delBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
                delBtn.onclick = function() { confirmDeleteCurrentClass(); };
                row.appendChild(delBtn);
            }
        }

        function saveCurrentClassToSessionCache() {
            var cls = currentClasses[activeClassIndex];
            if (!cls) return;
            
            var inputEl = document.getElementById("classQuickAnnouncementInput");
            var cachedData = {
                activeClass: cls,
                students: activeStudents,
                lessonLogs: activeClassLessonLogs,
                homeworkList: activeClassHomework,
                announcement: inputEl ? inputEl.value : ""
            };
            sessionStorage.setItem("class_cache_" + cls.classId, JSON.stringify(cachedData));
        }

        function selectClass(idx) {
            if (idx < 0 || idx >= currentClasses.length) {
                renderEmptyClassState();
                return;
            }
            activeClassIndex = idx;
            closeClassInvoice();

            var cls = currentClasses[idx];
            var cacheKey = "class_cache_" + cls.classId;
            var cached = sessionStorage.getItem(cacheKey);
            
            if (cached) {
                try {
                    var data = JSON.parse(cached);
                    activeStudents = data.students || [];
                    activeClassLessonLogs = data.lessonLogs || [];
                    activeClassHomework = data.homeworkList || [];
                    
                    renderDashboardUI();
                    
                    var inputEl = document.getElementById("classQuickAnnouncementInput");
                    if (inputEl) inputEl.value = data.announcement || "";
                    
                    renderRosterAndEvalGrid();
                    renderClassLessonLogsTableUI();
                    renderClassHomeworkListUI();
                } catch(e) {
                    console.error("Lỗi đọc cache local:", e);
                    clearAndShowClassSpinners();
                }
            } else {
                clearAndShowClassSpinners();
            }

            var phone = (currentTutorData && currentTutorData.tutorPhone) ? currentTutorData.tutorPhone : (window.tutorPhone || "");
            var code = (currentTutorData && (currentTutorData.tutorCode || currentTutorData.tutorId)) ? (currentTutorData.tutorCode || currentTutorData.tutorId) : (window.tutorCode || "");
            
            if (phone) {
                loadClassDetailDataOnly(phone, cls.classId, code);
            } else {
                console.warn("Không tìm thấy phone để tải dữ liệu lớp học chi tiết.");
            }
        }

        function clearAndShowClassSpinners() {
            activeStudents = [];
            activeClassLessonLogs = [];
            activeClassHomework = [];
            
            var rosterBody = document.getElementById("classRosterTableBody");
            if (rosterBody) rosterBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#A6ADCE; padding:20px;"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải học sinh...</td></tr>';
            
            var logsBody = document.getElementById("classLessonLogsTableBody");
            if (logsBody) logsBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#A6ADCE; padding:20px;"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải nhật ký...</td></tr>';
            
            var hwBody = document.getElementById("classHwTableBody");
            if (hwBody) hwBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#A6ADCE; padding:20px;"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải bài tập...</td></tr>';

            renderDashboardUI();
        }

        function loadClassDetailDataOnly(phone, requestedClassId, tutorCode) {
            google.script.run
                .withSuccessHandler(function(res) {
                    if (res && res.activeClass && res.activeClass.classId === requestedClassId) {
                        activeStudents = res.students || [];
                        activeClassLessonLogs = res.lessonLogs || [];
                        activeClassHomework = res.homeworkList || [];
                        
                        // Cập nhật bộ nhớ cache local
                        sessionStorage.setItem("class_cache_" + requestedClassId, JSON.stringify(res));

                        var inputEl = document.getElementById("classQuickAnnouncementInput");
                        if (inputEl) inputEl.value = res.announcement || "";

                        renderRosterAndEvalGrid();
                        renderClassLessonLogsTableUI();
                        renderClassHomeworkListUI();
                    }
                })
                .getClassDashboardData(phone, requestedClassId);
        }

        function loadStudentsForActiveClass() {
            var cls = currentClasses[activeClassIndex];
            if (!cls) {
                renderEmptyClassState();
                return;
            }

            var rosterTbody = document.getElementById("studentRosterTbody");
            if (rosterTbody) {
                rosterTbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#A6ADCE; padding: 20px;"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải danh sách học sinh...</td></tr>';
            }

            google.script.run.withSuccessHandler(function(list) {
                if (list && Array.isArray(list)) {
                    activeStudents = list;
                } else {
                    activeStudents = [];
                }
                renderRosterAndEvalGrid();
            }).getClassStudents(cls.classId);
        }

        function renderRosterAndEvalGrid() {
            var cls = currentClasses[activeClassIndex];
            document.getElementById("activeClassRosterCount").innerHTML = '<i class="fa-solid fa-user-group" style="margin-right: 6px;"></i>Sĩ số: ' + activeStudents.length + ' học sinh';

            // Render Roster
            var rosterTbody = document.getElementById("studentRosterTbody");
            if (activeStudents.length === 0) {
                rosterTbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#A6ADCE; padding: 20px;">Lớp này chưa có học sinh nào. Hãy nhấn nút "+ Thêm học sinh mới" bên trên!</td></tr>';
            } else {
                rosterTbody.innerHTML = activeStudents.map(function(st) {
                    var effectiveType = st.feeType || (cls ? cls.feeType : "per_session") || "per_session";
                    var feeBadge = effectiveType === 'monthly' 
                        ? '<span style="font-size:10.5px; padding:2px 6px; background:rgba(142,77,255,0.2); border:1px solid rgba(142,77,255,0.4); border-radius:8px; color:#C4B5FD; margin-left:4px;">/tháng</span>' 
                        : '<span style="font-size:10.5px; padding:2px 6px; background:rgba(16,185,129,0.2); border:1px solid rgba(16,185,129,0.4); border-radius:8px; color:#6EE7B7; margin-left:4px;">/buổi</span>';
                    
                    var unpaidCount = 0;
                    if (activeClassLessonLogs && activeClassLessonLogs.length > 0) {
                        activeClassLessonLogs.forEach(function(log) {
                            var sNotes = log.studentNotes || {};
                            var pInfo = sNotes[st.studentId] || {};
                            var att = pInfo.attendance || "Có mặt";
                            if (log.status === "Cả lớp nghỉ") att = "Cả lớp nghỉ";
                            if ((att === "Có mặt" || att === "Đi muộn") && !(pInfo.paid === true || pInfo.paid === "true")) {
                                unpaidCount++;
                            }
                        });
                    }

                    var payBadge = unpaidCount === 0
                        ? '<span style="font-size:11px; padding:3px 8px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.4); color:#6EE7B7; border-radius:12px; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Đã đóng đủ</span>'
                        : '<span style="font-size:11px; padding:3px 8px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); color:#FCA5A5; border-radius:12px; font-weight:700;"><i class="fa-solid fa-circle-exclamation"></i> Nợ ' + unpaidCount + ' buổi</span>';

                    return '<tr>' +
                        '<td style="font-weight:700; color:#FFD23F;">' + st.studentName + '</td>' +
                        '<td>' + (st.parentName || '-') + '</td>' +
                        '<td>' + (st.parentPhone || '-') + '</td>' +
                        '<td style="color:#8E4DFF; font-weight:700;">' + (st.homeworkCode || '-') + '</td>' +
                        '<td style="color:#10B981; font-weight:600;">' + (st.fee ? (parseInt(st.fee).toLocaleString('vi-VN') + ' đ' + feeBadge) : '-') + '<div style="margin-top:4px;">' + payBadge + '</div></td>' +
                        '<td style="text-align:center; vertical-align:middle; white-space:nowrap;">' +
                            '<div style="display:inline-flex; align-items:center; justify-content:center; gap:8px;">' +
                                '<button onclick="openClassInvoice(\'' + st.studentId + '\')" style="background:rgba(255,210,63,0.1); border:1px solid rgba(255,210,63,0.3); color:#FFD23F; cursor:pointer; padding:6px 10px; border-radius:15px; font-weight:700; font-size:12px; display:inline-flex; align-items:center; gap:4px;" title="Xuất hóa đơn & xác nhận đóng tiền"><i class="fa-solid fa-file-invoice-dollar"></i> Hóa đơn</button>' +
                                '<button onclick="openEditClassStudentModal(\'' + st.studentId + '\')" style="background:rgba(142,77,255,0.1); border:1px solid rgba(142,77,255,0.3); color:#C4B5FD; cursor:pointer; padding:6px 10px; border-radius:15px; font-weight:700; font-size:12px; display:inline-flex; align-items:center; gap:4px;" title="Chỉnh sửa thông tin học sinh"><i class="fa-solid fa-pen-to-square"></i> Sửa</button>' +
                                '<button onclick="removeStudent(\'' + st.studentId + '\')" style="background:none; border:none; color:#EF4444; cursor:pointer; font-size:14px; margin-left:4px;" title="Đưa vào thùng rác"><i class="fa-solid fa-trash"></i></button>' +
                            '</div>' +
                        '</td>' +
                    '</tr>';
                }).join('');
            }

        }

        // Modal Helpers
        function openModal(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.classList.add("active");
            el.style.display = "flex";
            el.style.pointerEvents = "auto";
        }
        function closeModal(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.classList.remove("active");
            el.style.display = "none";
            el.style.pointerEvents = "none";
        }

        function saveNewClass(btn) {
            var name = document.getElementById("newClassName").value.trim();
            var subject = document.getElementById("newClassSubject").value.trim();
            var schedule = document.getElementById("newClassSchedule").value.trim();
            var feeType = document.getElementById("newClassFeeType").value;

            if (!name) { showToast("Vui lòng nhập tên lớp học!", "error"); return; }

            var phone = (currentTutorData && currentTutorData.tutorPhone) 
                ? currentTutorData.tutorPhone 
                : (sessionStorage.getItem("userPhone") || localStorage.getItem("userPhone") || sessionStorage.getItem("tutorPhone") || localStorage.getItem("tutorPhone") || "");

            var tutorCode = (currentTutorData && (currentTutorData.tutorCode || currentTutorData.tutorId))
                ? (currentTutorData.tutorCode || currentTutorData.tutorId)
                : (sessionStorage.getItem("userCode") || localStorage.getItem("userCode") || "");

            if (!phone && !tutorCode) {
                showToast("Không tìm thấy thông tin đăng nhập của giáo viên. Vui lòng đăng nhập lại!", "error");
                window.location.href = "class-login.html";
                return;
            }

            var originalBtnHtml = "";
            if (btn) {
                btn.disabled = true;
                originalBtnHtml = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang tạo lớp...';
            }

            var tempId = "LH_" + new Date().getTime().toString().slice(-6);
            var newCls = {
                classId: tempId,
                className: name,
                subject: subject || "Chưa cập nhật",
                schedule: schedule || "Chưa cập nhật",
                maxStudents: "20",
                feeType: feeType || "per_session",
                tutorPhone: phone || tutorCode,
                tutorCode: tutorCode || phone
            };

            if (!currentTutorData) currentTutorData = { tutorPhone: phone, tutorCode: tutorCode };
            currentTutorData.tutorPhone = phone;
            if (tutorCode) currentTutorData.tutorCode = tutorCode;

            // OPTIMISTIC UI: Cập nhật memory & render UI trong 0.01s!
            currentClasses.push(newCls);
            currentTutorData.classes = currentClasses;
            sessionStorage.setItem("classTutorData", JSON.stringify(currentTutorData));
            localStorage.setItem("classTutorData", JSON.stringify(currentTutorData));

            activeClassIndex = currentClasses.length - 1;
            activeStudents = [];
            activeClassLessonLogs = [];
            activeClassHomework = [];

            closeModal("addClassModal");
            document.getElementById("newClassName").value = "";
            document.getElementById("newClassSubject").value = "";
            document.getElementById("newClassSchedule").value = "";

            renderDashboardUI();
            showSyncToast('pending');

            // Lưu ngầm ở server Google
            google.script.run
                .withSuccessHandler(function(res) {
                    showSyncToast('success');
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = originalBtnHtml;
                    }
                    if (res && res.classId) {
                        newCls.classId = res.classId;
                        currentTutorData.classes = currentClasses;
                        sessionStorage.setItem("classTutorData", JSON.stringify(currentTutorData));
                        localStorage.setItem("classTutorData", JSON.stringify(currentTutorData));
                    }
                })
                .withFailureHandler(function(err) {
                    showSyncToast('error');
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = originalBtnHtml;
                    }
                    console.error("Lỗi tạo lớp ngầm:", err);
                })
                .createClass(phone, name, subject, schedule, feeType, tutorCode);
        }

        function openEditClassModal() {
            var cls = currentClasses[activeClassIndex];
            if (!cls) {
                showToast("Vui lòng tạo hoặc chọn lớp học trước khi sửa!", "error");
                return;
            }
            document.getElementById("editClassName").value = cls.className;
            document.getElementById("editClassSubject").value = cls.subject || "";
            document.getElementById("editClassSchedule").value = cls.schedule || "";
            document.getElementById("editClassFeeType").value = cls.feeType || "per_session";
            openModal("editClassModal");
        }

        function saveEditClass() {
            var cls = currentClasses[activeClassIndex];
            if (!cls) return;
            var name = document.getElementById("editClassName").value.trim();
            var subject = document.getElementById("editClassSubject").value.trim();
            var schedule = document.getElementById("editClassSchedule").value.trim();
            var feeType = document.getElementById("editClassFeeType").value;

            if (!name) { showToast("Vui lòng nhập tên lớp!", "error"); return; }

            cls.className = name;
            cls.subject = subject;
            cls.schedule = schedule;
            cls.feeType = feeType;

            showSyncToast('pending');
            google.script.run.withSuccessHandler(function() { showSyncToast('success'); }).updateClassInfo(cls.classId, name, subject, schedule, feeType);
            closeModal("editClassModal");
            selectClass(activeClassIndex);
        }

        function deleteClass(classId) {
            var cls = currentClasses.find(function(c) { return c.classId === classId; });
            if (!cls) return;
            showCustomConfirm("Bạn có chắc chắn muốn xóa lớp " + cls.className + " không?", function() {
                showSyncToast('pending');
                google.script.run.withSuccessHandler(function() { showSyncToast('success'); }).deleteClass(cls.classId, cls.className);
                currentClasses.splice(activeClassIndex, 1);
                if (currentClasses.length === 0) {
                    renderClassNavRow();
                    renderEmptyClassState();
                } else {
                    selectClass(0);
                }
            });
        }

        function openAddStudentModal() { openModal("addStudentModal"); }

        function saveNewStudent() {
            var cls = currentClasses[activeClassIndex];
            if (!cls) {
                showToast("Vui lòng tạo hoặc chọn lớp học trước khi thêm học sinh!", "error");
                return;
            }

            var parentName = document.getElementById("newStudentParentName").value.trim();
            var name = document.getElementById("newStudentName").value.trim();
            var parentPhone = document.getElementById("newStudentParentPhone").value.trim();
            var fee = document.getElementById("newStudentFee").value.trim();
            var homeworkCode = document.getElementById("newStudentHomeworkCode").value.trim();
            var feeType = document.getElementById("newStudentFeeType").value;

            if (!name) { showToast("Vui lòng nhập họ và tên học sinh!", "error"); return; }

            // OPTIMISTIC UI: Thêm vào mảng & re-render ngay 0.01s!
            var stId = "HS_LH_" + new Date().getTime().toString().slice(-6);
            var newStudentObj = {
                studentId: stId,
                studentName: name,
                classId: cls.classId,
                parentPhone: parentPhone,
                parentName: parentName,
                fee: fee,
                homeworkCode: homeworkCode,
                feeType: feeType || "",
                joinDate: new Date().toLocaleDateString('vi-VN')
            };

            activeStudents.push(newStudentObj);
            closeModal("addStudentModal");
            document.getElementById("newStudentParentName").value = "";
            document.getElementById("newStudentName").value = "";
            document.getElementById("newStudentParentPhone").value = "";
            document.getElementById("newStudentFee").value = "";
            document.getElementById("newStudentHomeworkCode").value = "";

            renderRosterAndEvalGrid();
            showSyncToast('pending');

            google.script.run
                .withSuccessHandler(function(res) {
                    showSyncToast('success');
                    if (res && res.studentId) {
                        newStudentObj.studentId = res.studentId;
                        renderRosterAndEvalGrid();
                    }
                })
                .withFailureHandler(function(err) {
                    showSyncToast('error');
                    console.error("Lỗi lưu học sinh:", err);
                })
                .saveClassStudent(cls.classId, cls.className, name, parentPhone, parentName, fee, homeworkCode, feeType);
        }

        function removeStudent(studentId) {
            showCustomConfirm("Bạn có chắc chắn muốn chuyển học sinh này vào thùng rác không?", function() {
                // OPTIMISTIC UI: Xóa khỏi danh sách & render ngay lập tức!
                activeStudents = activeStudents.filter(function(st) { return st.studentId !== studentId; });
                renderRosterAndEvalGrid();
                showSyncToast('pending');
                google.script.run
                    .withSuccessHandler(function() { showSyncToast('success'); })
                    .withFailureHandler(function(err) { showSyncToast('error'); })
                    .deleteClassStudent(studentId);});
        }

        function deleteStudentFromEditModal() {
            var studentId = document.getElementById("editStudentId").value;
            if (!studentId) return;
            
            showCustomConfirm("Bạn có chắc chắn muốn chuyển học sinh này vào thùng rác không? (Có thể khôi phục lại bất kỳ lúc nào từ Thùng rác).", function() {
                closeModal("editClassStudentModal");
                removeStudent(studentId);});
        }

        // 1. Mở modal sửa thông tin học sinh
        function openEditClassStudentModal(studentId) {
            var st = activeStudents.find(function(s) { return s.studentId === studentId; });
            if (!st) return;
            
            document.getElementById("editStudentId").value = st.studentId;
            document.getElementById("editStudentName").value = st.studentName || "";
            document.getElementById("editParentName").value = st.parentName || "";
            document.getElementById("editParentPhone").value = st.parentPhone || "";
            document.getElementById("editStudentFee").value = st.fee || "";
            document.getElementById("editHomeworkCode").value = st.homeworkCode || "";
            document.getElementById("editStudentFeeType").value = st.feeType || "";
            
            openModal("editClassStudentModal");
        }

        // 2. Lưu sửa thông tin học sinh (Optimistic UI)
        function saveEditClassStudent() {
            var studentId = document.getElementById("editStudentId").value;
            var name = document.getElementById("editStudentName").value.trim();
            var parentName = document.getElementById("editParentName").value.trim();
            var parentPhone = document.getElementById("editParentPhone").value.trim();
            var fee = document.getElementById("editStudentFee").value.trim();
            var homeworkCode = document.getElementById("editHomeworkCode").value.trim();
            var feeType = document.getElementById("editStudentFeeType").value;

            if (!name || !parentPhone || !fee) {
                showToast("Vui lòng nhập đầy đủ các trường bắt buộc!", "error");
                return;
            }

            google.script.run.withSuccessHandler(function(res) {
                if (res && res.success) {
                    closeModal("editClassStudentModal");
                    loadStudentsForActiveClass();
                } else {
                    showToast("Lỗi cập nhật: " + (res.error || "Chưa xác định"), "error");
                }
            }).updateClassStudent(studentId, name, parentPhone, parentName, fee, homeworkCode, feeType);
        }

        // 3. Mở Thùng Rác Học Sinh Lớp Học
        function openClassStudentTrashModal() {
            var cls = currentClasses[activeClassIndex];
            if (!cls) return;

            var tbody = document.getElementById("classStudentTrashTbody");
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#A6ADCE; padding:15px;"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải thùng rác...</td></tr>';
            
            openModal("classStudentTrashModal");

            google.script.run.withSuccessHandler(function(list) {
                if (!list || list.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#A6ADCE; padding:20px;">Thùng rác trống!</td></tr>';
                    return;
                }

                tbody.innerHTML = list.map(function(st) {
                    return '<tr>' +
                        '<td style="font-weight:700; color:#FFD23F;">' + st.studentName + '</td>' +
                        '<td>' + (st.parentName || '-') + ' (' + (st.parentPhone || '-') + ')</td>' +
                        '<td style="color:#A6ADCE; font-size:12px;">' + st.deletedAt + '</td>' +
                        '<td style="text-align:center; vertical-align:middle; white-space:nowrap;">' +
                            '<div style="display:inline-flex; justify-content:center; align-items:center; gap:8px;">' +
                                '<button onclick="restoreClassStudent(\'' + st.studentId + '\')" style="background:rgba(16,185,129,0.15); border:1px solid #10B981; color:#6EE7B7; border-radius:15px; padding:4px 10px; font-size:12px; font-weight:700; cursor:pointer;"><i class="fa-solid fa-rotate-left"></i> Khôi phục</button>' +
                                '<button onclick="deleteClassStudentPermanently(\'' + st.studentId + '\')" style="background:rgba(239,68,68,0.15); border:1px solid #EF4444; color:#FCA5A5; border-radius:15px; padding:4px 10px; font-size:12px; font-weight:700; cursor:pointer;"><i class="fa-solid fa-trash-can"></i> Xóa vĩnh viễn</button>' +
                            '</div>' +
                        '</td>' +
                    '</tr>';
                }).join('');
            }).getClassTrashStudents(cls.classId);
        }

        // 4. Khôi phục học sinh từ thùng rác
        function restoreClassStudent(studentId) {
            google.script.run.withSuccessHandler(function() {
                openClassStudentTrashModal();
                loadStudentsForActiveClass();
            }).restoreClassStudent(studentId);
        }

        // 5. Xóa vĩnh viễn học sinh khỏi thùng rác
        function deleteClassStudentPermanently(studentId) {
            showCustomConfirm("Bạn có chắc chắn muốn xóa VĨNH VIỄN học sinh này khỏi Google Sheets? Hành động này không thể hoàn tác!", function() {
                google.script.run.withSuccessHandler(function() {
                    openClassStudentTrashModal();
                }).deleteClassStudentPermanently(studentId);});
        }

        var editingLessonLogId = null;

        function openAddClassLessonLogModal() {
            editingLessonLogId = null;
            var titleEl = document.getElementById("addClassLessonModalTitle");
            if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-calendar-plus" style="color: #FFD23F;"></i> Thêm nhật ký buổi học';

            var cls = currentClasses[activeClassIndex];
            if (!cls) {
                showToast("Vui lòng tạo hoặc chọn lớp học trước khi thêm buổi học!", "error");
                return;
            }

            var today = new Date();
            var dd = String(today.getDate()).padStart(2, '0');
            var mm = String(today.getMonth() + 1).padStart(2, '0');
            var yyyy = today.getFullYear();
            var dateStr = dd + '/' + mm + '/' + yyyy;

            document.getElementById("logWeekNum").value = "1";
            document.getElementById("logStudyDate").value = dateStr;
            document.getElementById("logSubject").value = cls.subject || "Toán học";
            document.getElementById("logStatus").value = "Có mặt";
            document.getElementById("logHwEval").value = "Hoàn thành";
            document.getElementById("logEntryTest").value = "";
            document.getElementById("logTermTest").value = "";
            document.getElementById("logGeneralNote").value = "";

            renderModalStudentNotesInputs();
            openModal("addClassLessonModal");
        }

        function openEditClassLessonLogModal(logId) {
            var log = activeClassLessonLogs.find(function(l) { return l.logId === logId; });
            if (!log) return;

            editingLessonLogId = logId;
            var titleEl = document.getElementById("addClassLessonModalTitle");
            if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: #FFD23F;"></i> Chỉnh sửa nhật ký buổi học';

            document.getElementById("logWeekNum").value = log.weekNum || "1";
            document.getElementById("logStudyDate").value = formatClassStudyDate(log.studyDate) || "";
            document.getElementById("logSubject").value = log.subject || "Toán học";
            document.getElementById("logStatus").value = log.status || "Có mặt";
            document.getElementById("logHwEval").value = log.hwEval || "Hoàn thành";
            document.getElementById("logEntryTest").value = log.entryTest || "";
            document.getElementById("logTermTest").value = log.termTest || "";
            document.getElementById("logGeneralNote").value = log.generalNote || "";

            renderModalStudentNotesInputs();

            if (log.studentNotes && typeof log.studentNotes === 'object') {
                Object.keys(log.studentNotes).forEach(function(stId) {
                    var info = log.studentNotes[stId];
                    var attEl = document.getElementById("stAtt_" + stId);
                    var noteEl = document.getElementById("stNote_" + stId);
                    var entryEl = document.getElementById("stEntryTest_" + stId);
                    var termEl = document.getElementById("stTermTest_" + stId);

                    if (attEl && info.attendance) attEl.value = info.attendance;
                    if (noteEl && info.privateNote) noteEl.value = info.privateNote;
                    if (entryEl && (info.entryTest || info.entryScore)) entryEl.value = info.entryTest || info.entryScore;
                    if (termEl && (info.termTest || info.termScore)) termEl.value = info.termTest || info.termScore;

                    updateStSummary(stId);
                });
            }

            openModal("addClassLessonModal");
        }

        function renderModalStudentNotesInputs() {
            var listEl = document.getElementById("modalStudentNotesList");
            if (!listEl) return;
            listEl.innerHTML = "";

            if (activeStudents && activeStudents.length > 0) {
                activeStudents.forEach(function(st) {
                    var card = document.createElement("div");
                    card.style.cssText = "background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 10px 14px; margin-bottom: 8px;";
                    card.innerHTML = 
                        '<div onclick="toggleSingleStudentNote(\'' + st.studentId + '\')" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; user-select:none;">' +
                            '<span style="color:#FFD23F; font-weight:700; font-size:14px; display:inline-flex; align-items:center; gap:8px;">' +
                                '<i class="fa-solid fa-user-pen" style="color:#8E4DFF;"></i> ' + st.studentName +
                            '</span>' +
                            '<span style="display:inline-flex; align-items:center; gap:8px; font-size:12.5px; color:#A6ADCE;">' +
                                '<span id="stSummary_' + st.studentId + '" style="color:#10B981; font-weight:600;">🟢 Có mặt</span>' +
                                '<i id="stIcon_' + st.studentId + '" class="fa-solid fa-chevron-down" style="transition:transform 0.3s;"></i>' +
                            '</span>' +
                        '</div>' +
                        '<div id="stDetailContainer_' + st.studentId + '" style="display:none; margin-top:12px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.1);">' +
                            '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">' +
                                '<label style="color:#A6ADCE; font-size:12px; font-weight:700;">ĐIỂM DANH HỌC SINH:</label>' +
                                '<select id="stAtt_' + st.studentId + '" onchange="updateStSummary(\'' + st.studentId + '\')" class="form-control" style="width:auto; padding:4px 12px; font-size:12.5px; background:rgba(255,255,255,0.06); border-radius:8px; color:#10B981; outline:none;">' +
                                    '<option value="Có mặt" style="background:#0D0826;">🟢 Có mặt</option>' +
                                    '<option value="Muộn" style="background:#0D0826;">🟠 Đi muộn</option>' +
                                    '<option value="Vắng" style="background:#0D0826;">🔴 Vắng</option>' +
                                '</select>' +
                            '</div>' +
                            '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">' +
                                '<div>' +
                                    '<label style="display:block; color:#A6ADCE; font-size:11.5px; font-weight:700; margin-bottom:4px;">KT ĐẦU GIỜ (RIÊNG):</label>' +
                                    '<input type="text" id="stEntryTest_' + st.studentId + '" oninput="updateStSummary(\'' + st.studentId + '\')" class="form-control" placeholder="Ví dụ: 8.5" style="background:rgba(255,255,255,0.04); font-size:12.5px; padding:8px 12px; border-radius:8px; width:100%; outline:none; color:#FFF;">' +
                                '</div>' +
                                '<div>' +
                                    '<label style="display:block; color:#A6ADCE; font-size:11.5px; font-weight:700; margin-bottom:4px;">KT ĐỊNH KỲ (RIÊNG):</label>' +
                                    '<input type="text" id="stTermTest_' + st.studentId + '" oninput="updateStSummary(\'' + st.studentId + '\')" class="form-control" placeholder="Ví dụ: 9.0" style="background:rgba(255,255,255,0.04); font-size:12.5px; padding:8px 12px; border-radius:8px; width:100%; outline:none; color:#FFF;">' +
                                '</div>' +
                            '</div>' +
                            '<div>' +
                                '<label style="display:block; color:#A6ADCE; font-size:12px; font-weight:700; margin-bottom:6px;">NHẬN XÉT RIÊNG TỪ THẦY:</label>' +
                                '<input type="text" id="stNote_' + st.studentId + '" class="form-control" placeholder="Nhập nhận xét riêng cho em ' + st.studentName + ' (phụ huynh bé sẽ thấy)..." style="background:rgba(255,255,255,0.04); font-size:13px; padding:10px 14px; border-radius:10px; width:100%; outline:none;">' +
                            '</div>' +
                        '</div>';
                    listEl.appendChild(card);
                });
            } else {
                listEl.innerHTML = '<div style="color:#A6ADCE; font-size:13px; font-style:italic;">Lớp này chưa có danh sách học sinh.</div>';
            }
        }

        function toggleSingleStudentNote(stId) {
            var detail = document.getElementById("stDetailContainer_" + stId);
            var icon = document.getElementById("stIcon_" + stId);
            var summary = document.getElementById("stSummary_" + stId);
            if (!detail) return;
            if (detail.style.display === "none" || detail.style.display === "") {
                detail.style.display = "block";
                if (icon) icon.style.transform = "rotate(180deg)";
                if (summary) summary.style.display = "none";
            } else {
                detail.style.display = "none";
                if (icon) icon.style.transform = "rotate(0deg)";
                if (summary) summary.style.display = "inline";
            }
        }

        function updateStSummary(stId) {
            var attEl = document.getElementById("stAtt_" + stId);
            var sumEl = document.getElementById("stSummary_" + stId);
            var entryEl = document.getElementById("stEntryTest_" + stId);
            var termEl = document.getElementById("stTermTest_" + stId);
            if (!attEl || !sumEl) return;
            
            var val = attEl.value;
            var text = "🟢 Có mặt";
            var color = "#10B981";
            if (val === "Muộn") {
                color = "#F97316";
                text = "🟠 Đi muộn";
            } else if (val === "Vắng") {
                color = "#EF4444";
                text = "🔴 Vắng";
            }

            var extra = [];
            if (entryEl && entryEl.value.trim()) extra.push("Đầu giờ: " + entryEl.value.trim());
            if (termEl && termEl.value.trim()) extra.push("Định kỳ: " + termEl.value.trim());

            sumEl.style.color = color;
            sumEl.innerText = text + (extra.length > 0 ? " | " + extra.join(", ") : "");
        }

        function toggleStudentNotesAccordion() {
            var container = document.getElementById("studentNotesAccordionContainer");
            var icon = document.getElementById("accordionIcon");
            if (container.style.display === "none" || container.style.display === "") {
                container.style.display = "block";
                if (icon) icon.style.transform = "rotate(180deg)";
            } else {
                container.style.display = "none";
                if (icon) icon.style.transform = "rotate(0deg)";
            }
        }

        function saveClassLessonLog() {
            var cls = currentClasses[activeClassIndex];
            if (!cls) return;

            var weekNum = document.getElementById("logWeekNum").value.trim();
            var studyDate = document.getElementById("logStudyDate").value.trim();
            var subject = document.getElementById("logSubject").value;
            var status = document.getElementById("logStatus").value;
            var hwEval = document.getElementById("logHwEval").value;
            var entryTest = document.getElementById("logEntryTest").value.trim() || "-";
            var termTest = document.getElementById("logTermTest").value.trim() || "-";
            var generalNote = document.getElementById("logGeneralNote").value.trim();

            if (!studyDate) {
                showToast("Vui lòng nhập ngày học!", "error");
                return;
            }

            // Gom nhận xét riêng và điểm số riêng từng học sinh
            var studentNotesObj = {};
            if (activeStudents && activeStudents.length > 0) {
                activeStudents.forEach(function(st) {
                    var attEl = document.getElementById("stAtt_" + st.studentId);
                    var noteEl = document.getElementById("stNote_" + st.studentId);
                    var entryEl = document.getElementById("stEntryTest_" + st.studentId);
                    var termEl = document.getElementById("stTermTest_" + st.studentId);

                    var att = attEl ? attEl.value : "Có mặt";
                    var note = noteEl ? noteEl.value.trim() : "";
                    var entry = entryEl ? entryEl.value.trim() : "";
                    var term = termEl ? termEl.value.trim() : "";

                    if (att !== "Có mặt" || note !== "" || entry !== "" || term !== "") {
                        studentNotesObj[st.studentId] = {
                            studentName: st.studentName,
                            attendance: att,
                            privateNote: note,
                            entryTest: entry,
                            termTest: term
                        };
                    }
                });
            }

            var studentNotesJson = JSON.stringify(studentNotesObj);

            if (!activeClassLessonLogs) activeClassLessonLogs = [];

            if (editingLessonLogId) {
                var targetLog = activeClassLessonLogs.find(function(l) { return l.logId === editingLessonLogId; });
                if (targetLog) {
                    targetLog.weekNum = weekNum;
                    targetLog.studyDate = studyDate;
                    targetLog.subject = subject;
                    targetLog.status = status;
                    targetLog.hwEval = hwEval;
                    targetLog.entryTest = entryTest;
                    targetLog.termTest = termTest;
                    targetLog.generalNote = generalNote;
                    targetLog.studentNotes = studentNotesObj;
                }
            } else {
                var newLog = {
                    logId: "LOG_" + new Date().getTime(),
                    classId: cls.classId,
                    className: cls.className,
                    weekNum: weekNum,
                    studyDate: studyDate,
                    subject: subject,
                    status: status,
                    hwEval: hwEval,
                    entryTest: entryTest,
                    termTest: termTest,
                    generalNote: generalNote,
                    studentNotes: studentNotesObj
                };
                activeClassLessonLogs.unshift(newLog);
            }

            closeModal("addClassLessonModal");
            renderClassLessonLogsTableUI();

            showSyncToast('pending');
            // Gửi ngầm bên dưới
            google.script.run.withSuccessHandler(function() { showSyncToast('success'); }).saveClassLessonLog(
                cls.classId,
                cls.className,
                weekNum,
                studyDate,
                subject,
                status,
                hwEval,
                entryTest,
                termTest,
                generalNote,
                studentNotesJson
            );
        }

        function formatClassStudyDate(dateVal) {
            if (!dateVal || dateVal === '-') return '-';
            var s = String(dateVal).trim();
            if (!s) return '-';
            
            if (s.includes('T') || (s.includes('-') && s.length > 7)) {
                var d = new Date(s);
                if (!isNaN(d.getTime())) {
                    var dd = String(d.getDate()).padStart(2, '0');
                    var mm = String(d.getMonth() + 1).padStart(2, '0');
                    var yyyy = d.getFullYear();
                    return dd + '/' + mm + '/' + yyyy;
                }
            }
            return s;
        }

        function renderClassLessonLogsTableUI() {
            var cls = currentClasses[activeClassIndex];
            var tbody = document.getElementById("classLessonLogsTbody");
            if (!cls || !tbody) return;

            if (!activeClassLessonLogs || !Array.isArray(activeClassLessonLogs) || activeClassLessonLogs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:#A6ADCE; padding:25px;">Chưa có nhật ký buổi học nào. Vui lòng bấm nút <b>"+ Thêm buổi học"</b> góc trên để tạo!</td></tr>';
                return;
            }

            tbody.innerHTML = activeClassLessonLogs.map(function(log) {
                var statusBadge = '';
                var st = log.status || "Có mặt";
                if (st === "Có mặt" || st === "Đã học") {
                    statusBadge = '<span style="padding:4px 12px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.4); color:#6EE7B7; border-radius:15px; font-weight:700; font-size:12px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;">🟢 Đã học</span>';
                } else if (st === "Đi muộn") {
                    statusBadge = '<span style="padding:4px 12px; background:rgba(249,115,22,0.15); border:1px solid rgba(249,115,22,0.4); color:#FDBA74; border-radius:15px; font-weight:700; font-size:12px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;">🟠 Đi muộn</span>';
                } else {
                    statusBadge = '<span style="padding:4px 12px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); color:#FCA5A5; border-radius:15px; font-weight:700; font-size:12px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;">🔴 Hủy / Nghỉ</span>';
                }

                var hwBadge = '<span style="padding:4px 12px; background:rgba(142,77,255,0.15); border:1px solid rgba(142,77,255,0.3); color:#E2D1FF; border-radius:15px; font-size:12.5px; white-space:nowrap;">' + (log.hwEval || 'Bình thường') + '</span>';

                var noteDisplay = log.generalNote || '<i>(Chưa có nhận xét)</i>';
                
                var pNoteCount = (log.studentNotes && typeof log.studentNotes === 'object') ? Object.keys(log.studentNotes).length : 0;
                if (pNoteCount > 0) {
                    noteDisplay += '<div style="margin-top:6px; font-size:12px; color:#FFD23F;"><i class="fa-solid fa-user-pen"></i> Có ' + pNoteCount + ' học sinh có nhận xét riêng từ Thầy</div>';
                }

                return '<tr>' +
                    '<td style="text-align:center; color:#A6ADCE; font-weight:600;">' + (log.weekNum || '-') + '</td>' +
                    '<td style="font-weight:700; color:#FFF; white-space:nowrap;">' + formatClassStudyDate(log.studyDate) + '</td>' +
                    '<td style="color:#C4B5FD; font-weight:600;">' + (log.subject || '-') + '</td>' +
                    '<td style="color:#FFF; line-height:1.5;">' + noteDisplay + '</td>' +
                    '<td>' + hwBadge + '</td>' +
                    '<td style="text-align:center; color:#FFF; font-weight:600;">' + (log.entryTest && log.entryTest !== 'Không có' ? log.entryTest : '-') + '</td>' +
                    '<td style="text-align:center; color:#FFF; font-weight:600;">' + (log.termTest && log.termTest !== 'Không có' ? log.termTest : '-') + '</td>' +
                    '<td style="text-align:center;">' + statusBadge + '</td>' +
                    '<td style="text-align:center; vertical-align:middle; white-space:nowrap;">' +
                        '<div style="display:inline-flex; align-items:center; justify-content:center; gap:10px;">' +
                            '<button onclick="openEditClassLessonLogModal(\'' + log.logId + '\')" style="background:rgba(142,77,255,0.15); border:1px solid rgba(142,77,255,0.3); color:#C4B5FD; cursor:pointer; padding:4px 8px; border-radius:12px; font-size:12px; display:inline-flex; align-items:center; gap:4px;" title="Sửa nhật ký buổi học này"><i class="fa-solid fa-pen-to-square"></i> Sửa</button>' +
                            '<button onclick="deleteClassLessonLog(\'' + log.logId + '\')" style="background:none; border:none; color:#EF4444; cursor:pointer; font-size:15px;" title="Xóa buổi học này"><i class="fa-solid fa-trash"></i></button>' +
                        '</div>' +
                    '</td>' +
                '</tr>';
            }).join('');
        }

        function deleteClassLessonLog(logId) {
            showCustomConfirm("Bạn có chắc chắn muốn xóa nhật ký buổi học này không?", function() {
                var cls = currentClasses[activeClassIndex];
                var className = cls ? cls.className : "";

                // OPTIMISTIC UI: Xóa khỏi mảng và vẽ lại UI trong 0.05s!
                activeClassLessonLogs = activeClassLessonLogs.filter(function(log) { return log.logId !== logId; });
                renderClassLessonLogsTableUI();

                showSyncToast('pending');
                // Gửi ngầm bên dưới với đầy đủ tham số (logId, className)
                google.script.run.withSuccessHandler(function() { 
                    showSyncToast('success'); 
                }).withFailureHandler(function(err) {
                    showSyncToast('error');
                    console.error("Lỗi xóa nhật ký buổi học:", err);
                }).deleteClassLessonLog(logId, className);
            });
        }

        function refreshClassHistory() {
            renderClassLessonLogsTableUI();
        }

        // === QUICK ANNOUNCEMENT HANDLERS ===
        function saveClassQuickAnnouncement() {
            var cls = currentClasses[activeClassIndex];
            if (!cls) {
                showToast("Vui lòng chọn hoặc tạo lớp học trước!", "error");
                return;
            }
            var text = document.getElementById("classQuickAnnouncementInput").value.trim();
            var statusEl = document.getElementById("classAnnouncementStatus");
            var btn = document.getElementById("btnSaveClassQuickAnnouncement");
            
            if (btn) btn.disabled = true;
            google.script.run.withSuccessHandler(function(res) {
                if (btn) btn.disabled = false;
                if (statusEl) {
                    statusEl.style.display = "inline-flex";
                    setTimeout(function() { statusEl.style.display = "none"; }, 3000);
                }
            }).saveClassAnnouncement(cls.classId, cls.className, text);
        }

        function loadClassAnnouncement() {
            var cls = currentClasses[activeClassIndex];
            var inputEl = document.getElementById("classQuickAnnouncementInput");
            if (!cls || !inputEl) return;
            
            inputEl.value = "";
            google.script.run.withSuccessHandler(function(text) {
                if (inputEl) inputEl.value = text || "";
            }).getClassAnnouncement(cls.classId);
        }

        // === HOMEWORK ASSIGNMENT HANDLERS ===
        var selectedClassHwFile = null;

        function switchClassHwTab(tab) {
            var assignBtn = document.getElementById("classHwTabAssignBtn");
            var submitBtn = document.getElementById("classHwTabSubmitBtn");
            var feedbackBtn = document.getElementById("classHwTabFeedbackBtn");
            
            var assignContent = document.getElementById("classHwTabContentAssign");
            var submitContent = document.getElementById("classHwTabContentSubmit");
            var feedbackContent = document.getElementById("classHwTabContentFeedback");

            if (assignBtn) { assignBtn.style.background = "rgba(255,255,255,0.04)"; assignBtn.style.borderColor = "rgba(255,255,255,0.1)"; assignBtn.style.color = "#A6ADCE"; }
            if (submitBtn) { submitBtn.style.background = "rgba(255,255,255,0.04)"; submitBtn.style.borderColor = "rgba(255,255,255,0.1)"; submitBtn.style.color = "#A6ADCE"; }
            if (feedbackBtn) { feedbackBtn.style.background = "rgba(255,255,255,0.04)"; feedbackBtn.style.borderColor = "rgba(255,255,255,0.1)"; feedbackBtn.style.color = "#A6ADCE"; }

            if (assignContent) assignContent.style.display = "none";
            if (submitContent) submitContent.style.display = "none";
            if (feedbackContent) feedbackContent.style.display = "none";

            if (tab === "assign") {
                if (assignBtn) { assignBtn.style.background = "rgba(142,77,255,0.2)"; assignBtn.style.borderColor = "#8E4DFF"; assignBtn.style.color = "#FFF"; }
                if (assignContent) assignContent.style.display = "block";
            } else if (tab === "submit") {
                if (submitBtn) { submitBtn.style.background = "rgba(142,77,255,0.2)"; submitBtn.style.borderColor = "#8E4DFF"; submitBtn.style.color = "#FFF"; }
                if (submitContent) submitContent.style.display = "block";
                loadClassSubmissions();
            } else if (tab === "feedback") {
                if (feedbackBtn) { feedbackBtn.style.background = "rgba(56,189,248,0.2)"; feedbackBtn.style.borderColor = "#38BDF8"; feedbackBtn.style.color = "#FFF"; }
                if (feedbackContent) feedbackContent.style.display = "block";
                loadClassParentFeedback();
            }
        }

        function loadClassParentFeedback() {
            var container = document.getElementById("classParentFeedbackContainer");
            if (container) container.innerHTML = '<div style="text-align: center; color: #A6ADCE; padding: 30px;"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải ý kiến phụ huynh...</div>';
            
            var phone = currentTutorData ? (currentTutorData.tutorPhone || "") : "";
            var code = currentTutorData ? (currentTutorData.tutorCode || "") : "";
            
            google.script.run.withSuccessHandler(function(feedbacks) {
                if (!feedbacks || !Array.isArray(feedbacks) || feedbacks.length === 0) {
                    if (container) container.innerHTML = '<div style="text-align: center; color: #10B981; padding: 30px; font-weight: bold;"><i class="fa-solid fa-circle-check" style="font-size: 28px; display: block; margin-bottom: 8px;"></i> Chưa có ý kiến đóng góp mới từ Phụ huynh.</div>';
                    return;
                }
                
                var html = feedbacks.map(function(fb) {
                    return '<div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 15px 18px; margin-bottom: 12px;">' +
                        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">' +
                            '<span style="font-weight: 800; color: #FFD23F; font-size: 14px;"><i class="fa-solid fa-user-tie" style="color:#38BDF8;"></i> Phụ huynh em: ' + fb.studentName + ' (' + fb.studentPhone + ')</span>' +
                            '<span style="font-size: 12px; color: #A6ADCE;"><i class="fa-regular fa-clock"></i> ' + fb.timestamp + '</span>' +
                        '</div>' +
                        '<div style="color: #FFF; font-size: 13.5px; line-height: 1.6; background: rgba(0,0,0,0.2); padding: 10px 14px; border-radius: 10px; border-left: 3px solid #38BDF8;">' + fb.content + '</div>' +
                    '</div>';
                }).join('');
                
                if (container) container.innerHTML = html;
            }).withFailureHandler(function(err) {
                if (container) container.innerHTML = '<div style="color:#EF4444; padding:20px; text-align:center;">Lỗi tải phản hồi: ' + err.toString() + '</div>';
            }).getClassTutorFeedback(phone, code);
        }

        // Tải danh sách bài nộp của lớp học nhóm
        function loadClassSubmissions() {
            var cls = currentClasses[activeClassIndex];
            if (!cls) return;
            
            var tbody = document.getElementById("classSubmissionsTableBody");
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#A6ADCE; padding: 25px;"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải danh sách bài nộp...</td></tr>';
            }
            
            google.script.run.withSuccessHandler(function(submissions) {
                if (!tbody) return;
                if (!submissions || submissions.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#A6ADCE; padding: 25px;">Chưa có học sinh nào nộp bài tập.</td></tr>';
                    return;
                }
                
                tbody.innerHTML = submissions.map(function(sub) {
                    return '<tr>' +
                        '<td style="font-weight:700; color:#FFD23F;">' + sub.studentName + '</td>' +
                        '<td style="color:#C4B5FD;">' + sub.title + '</td>' +
                        '<td style="color:#A6ADCE;">' + sub.submittedAt + '</td>' +
                        '<td>' + (sub.fileUrl ? '<a href="' + sub.fileUrl + '" target="_blank" style="color:#10B981; font-weight:700; text-decoration:none;"><i class="fa-solid fa-file-arrow-down"></i> Tải bài làm</a>' : '-') + '</td>' +
                        '<td style="text-align:center;"><span style="padding:4px 12px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.4); color:#6EE7B7; border-radius:15px; font-weight:700; font-size:12px;">Đã nộp</span></td>' +
                    '</tr>';
                }).join('');
            }).getClassSubmissions(cls.classId);
        }

        // === HÓA ĐƠN & PHIẾU HỌC TẬP LỚP HỌC ===
        var activeInvoiceStudentId = null;

        function openClassInvoice(studentId) {
            var cls = currentClasses[activeClassIndex];
            if (!cls) return;
            
            var student = activeStudents.find(function(s) { return s.studentId === studentId; });
            if (!student) return;
            
            activeInvoiceStudentId = studentId;
            
            var container = document.getElementById("invoiceCollapseContainer");
            container.style.display = "block";
            
            // Populate Month Filter
            var monthSet = new Set();
            activeClassLessonLogs.forEach(function(log) {
                if (log.studyDate) {
                    var parts = log.studyDate.split('/');
                    if (parts.length >= 3) {
                        monthSet.add(parts[1] + '/' + parts[2]);
                    }
                }
            });
            var monthSelect = document.getElementById("invMonthFilter");
            monthSelect.innerHTML = '<option value="all">Tất cả lịch sử</option>';
            Array.from(monthSet).sort().reverse().forEach(function(m) {
                monthSelect.innerHTML += '<option value="' + m + '">Tháng ' + m + '</option>';
            });
            
            container.scrollIntoView({ behavior: 'smooth' });
            
            document.getElementById("invStudentName").innerText = student.studentName;
            document.getElementById("invClassDisplay").innerText = cls.className + " (" + (cls.subject || "Nhóm lớp") + ")";
            
            // Lấy QR Code giáo viên
            var qrImg = document.getElementById("invQrImg");
            var qrText = document.getElementById("invQrText");
            var tutorData = JSON.parse(sessionStorage.getItem("classTutorData") || sessionStorage.getItem("userTutorData") || "{}");
            if (tutorData && tutorData.qrCode) {
                qrImg.src = tutorData.qrCode;
                qrImg.style.display = "block";
                qrText.innerText = "Quét mã để thanh toán";
            } else {
                qrImg.src = "";
                qrImg.style.display = "none";
                qrText.innerText = "Chưa có QR thanh toán";
            }
            
            renderClassStudentInvoice(student);
        }

        function closeClassInvoice() {
            var container = document.getElementById("invoiceCollapseContainer");
            if (container) container.style.display = "none";
            activeInvoiceStudentId = null;
        }

        function renderClassStudentInvoice(student) {
            var feePerClass = parseFloat(student.fee) || 75000;
            
            var presentClasses = 0;
            var lateClasses = 0;
            var absentClasses = 0;
            
            var doneHwCount = 0;
            var missHwCount = 0;
            
            var unpaidClasses = 0;
            
            var tableBody = document.getElementById("invoiceLessonsTableBody");
            tableBody.innerHTML = "";
            
            var selectedMonth = document.getElementById("invMonthFilter").value;
            var studentLogs = [];
            
                var formattedDate = formatClassStudyDate(log.studyDate);
                if (selectedMonth !== "all") {
                    var parts = (formattedDate || "").split('/');
                    if (parts.length < 3 || (parts[1] + '/' + parts[2]) !== selectedMonth) {
                        return;
                    }
                }
                
                var studentNotes = log.studentNotes || {};
                var personalInfo = studentNotes[student.studentId] || {};
                
                var att = personalInfo.attendance || "Có mặt";
                var note = personalInfo.privateNote || "";
                var paid = personalInfo.paid === true || personalInfo.paid === "true";
                
                if (log.status === "Cả lớp nghỉ") {
                    att = "Cả lớp nghỉ";
                }
                
                studentLogs.push({
                    logId: log.logId,
                    studyDate: formattedDate,
                    attendance: att,
                    hwEval: log.hwEval,
                    note: note,
                    paid: paid
                });
            });
            
            studentLogs.forEach(function(sLog) {
                var attStr = sLog.attendance;
                var color = "#4B5563";
                
                if (attStr === "Có mặt") {
                    presentClasses++;
                    color = "#10B981";
                } else if (attStr === "Đi muộn") {
                    lateClasses++;
                    color = "#F59E0B";
                } else if (attStr === "Vắng" || attStr === "Vắng mặt") {
                    absentClasses++;
                    color = "#EF4444";
                } else if (attStr === "Cả lớp nghỉ") {
                    color = "#EF4444";
                }
                
                var hwStr = sLog.hwEval || "";
                if (hwStr.indexOf("Hoàn thành") !== -1) {
                    doneHwCount++;
                } else if (hwStr !== "") {
                    missHwCount++;
                }
                
                var isBillable = (attStr === "Có mặt" || attStr === "Đi muộn");
                var checkboxHtml = "-";
                if (isBillable) {
                    if (!sLog.paid) unpaidClasses++;
                    checkboxHtml = '<input type="checkbox" ' + (sLog.paid ? 'checked' : '') + 
                        ' data-logid="' + sLog.logId + '" data-studentid="' + student.studentId + '" class="log-checkbox" onchange="toggleClassStudentPayment(this)" style="transform: scale(1.2); cursor:pointer;">';
                }
                
                tableBody.innerHTML += '<tr>' +
                    '<td style="padding:10px 12px; border-bottom:1px solid #E5E7EB; font-weight:600; color:#374151;">' + sLog.studyDate + '</td>' +
                    '<td style="padding:10px 12px; border-bottom:1px solid #E5E7EB; color:' + color + '; font-weight:700;">' + attStr + '</td>' +
                    '<td style="padding:10px 12px; border-bottom:1px solid #E5E7EB; color:#374151;">' + (hwStr || '-') + '</td>' +
                    '<td style="padding:10px 12px; border-bottom:1px solid #E5E7EB; text-align:center;">' + checkboxHtml + '</td>' +
                '</tr>';
            });
            
            document.getElementById("invAttP").innerText = presentClasses;
            document.getElementById("invAttL").innerText = lateClasses;
            document.getElementById("invAttA").innerText = absentClasses;
            
            document.getElementById("invHwDone").innerText = doneHwCount + " buổi";
            document.getElementById("invHwMiss").innerText = missHwCount + " buổi";
            
            var cls = currentClasses[activeClassIndex];
            var effectiveFeeType = student.feeType || (cls ? cls.feeType : "per_session") || "per_session";

            var totalFee = 0;
            if (effectiveFeeType === "monthly") {
                totalFee = (unpaidClasses > 0) ? feePerClass : 0;
                document.getElementById("invFeeCalcText").innerText = "Học phí trọn gói tháng (Đã học " + (presentClasses + lateClasses) + " buổi):";
                document.getElementById("invFeeCalcTotal").innerText = feePerClass.toLocaleString('vi-VN') + " VNĐ/tháng";
                
                var msg = "Dạ em chào anh/chị, em gửi anh chị phiếu học tập tổng hợp của bé " + student.studentName + " (Lớp: " + (cls ? cls.className : "") + ") ạ.\n" +
                    "Học phí trọn gói là " + feePerClass.toLocaleString('vi-VN') + " VNĐ.\n" +
                    (totalFee === 0 ? "Trạng thái: Đã hoàn tất đóng học phí.\n" : "Trạng thái: Chưa đóng học phí.\n") +
                    "Anh/chị quét mã QR trên phiếu để thanh toán giúp em nhé. Em cảm ơn ạ!";
                document.getElementById("invTextarea").value = msg;
                window.currentInvoiceMsgBase = msg;
            } else {
                totalFee = unpaidClasses * feePerClass;
                document.getElementById("invFeeCalcText").innerText = "Học phí chưa đóng (" + feePerClass.toLocaleString('vi-VN') + "đ × " + unpaidClasses + " buổi):";
                document.getElementById("invFeeCalcTotal").innerText = totalFee.toLocaleString('vi-VN') + " VNĐ";
                
                var msg = "Dạ em chào anh/chị, em gửi anh chị phiếu học tập tổng hợp của bé " + student.studentName + " (Lớp: " + (cls ? cls.className : "") + ") ạ.\n" +
                    "Tổng số buổi học chưa đóng phí là " + unpaidClasses + " buổi, thành tiền học phí là " + totalFee.toLocaleString('vi-VN') + " VNĐ.\n" +
                    "Anh/chị quét mã QR trên phiếu để thanh toán giúp em nhé. Em cảm ơn ạ!";
                document.getElementById("invTextarea").value = msg;
                window.currentInvoiceMsgBase = msg;
            }
            
            window.currentBaseTotalFee = totalFee;
            document.getElementById("invExtraFee").value = "";
            document.getElementById("invDiscountFee").value = "";
            calculateGrandTotalInvoice();
        }

        function calculateGrandTotalInvoice() {
            var extra = parseFloat(document.getElementById("invExtraFee").value) || 0;
            var discount = parseFloat(document.getElementById("invDiscountFee").value) || 0;
            var finalTotal = (window.currentBaseTotalFee || 0) + extra - discount;
            if (finalTotal < 0) finalTotal = 0;
            
            document.getElementById("invGrandTotal").innerText = finalTotal.toLocaleString('vi-VN') + " đ";
            
            var msgObj = document.getElementById("invTextarea");
            var originalMsg = window.currentInvoiceMsgBase || "";
            
            if (extra > 0 || discount > 0) {
                var addText = "\nTrong đó:";
                if (extra > 0) addText += "\n- Phụ phí (+): " + extra.toLocaleString('vi-VN') + " đ";
                if (discount > 0) addText += "\n- Giảm trừ (-): " + discount.toLocaleString('vi-VN') + " đ";
                addText += "\n=> TỔNG CẦN THANH TOÁN: " + finalTotal.toLocaleString('vi-VN') + " đ";
                msgObj.value = originalMsg + "\n" + addText;
            } else {
                msgObj.value = originalMsg;
            }
        }
        
        function markAllInvoicePaid() {
            if (!activeInvoiceStudentId) return;
            var btn = document.getElementById("btnMarkInvoicePaid");
            
            // Tìm tất cả logIds đang hiển thị và chưa thanh toán
            var checkboxes = document.querySelectorAll('#invoiceLessonsTableBody input[type="checkbox"]:not(:checked)');
            if (checkboxes.length === 0) {
                showToast("Tất cả buổi học đang hiển thị đều đã được thanh toán!", "success");
                return;
            }
            
            var logIds = Array.from(checkboxes).map(function(cb) { return cb.getAttribute("data-logid"); });
            
            showCustomConfirm("Bạn có chắc chắn đánh dấu " + logIds.length + " buổi học này là ĐÃ THANH TOÁN?", function() {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...';
                showSyncToast('pending');
                
                google.script.run.withSuccessHandler(function(res) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-check-double"></i> Xác nhận Đã Thu tiền';
                    if (res && res.success) {
                        showSyncToast('success');
                        
                        // Cập nhật Optimistic UI
                        activeClassLessonLogs.forEach(function(log) {
                            if (logIds.includes(log.logId)) {
                                if (!log.studentNotes) log.studentNotes = {};
                                if (!log.studentNotes[activeInvoiceStudentId]) log.studentNotes[activeInvoiceStudentId] = {};
                                log.studentNotes[activeInvoiceStudentId].paid = true;
                            }
                        });
                        
                        var student = activeStudents.find(function(s) { return s.studentId === activeInvoiceStudentId; });
                        if (student) renderClassStudentInvoice(student);
                        renderRosterAndEvalGrid();
                        renderClassLessonLogsTableUI();
                        showToast("Đã xác nhận thu tiền thành công!", "success");
                    } else {
                        showSyncToast('error');
                        showToast("Lỗi đồng bộ: " + (res.error || "Không xác định"), "error");
                    }
                }).withFailureHandler(function(err) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fa-solid fa-check-double"></i> Xác nhận Đã Thu tiền';
                    showSyncToast('error');
                    showToast("Lỗi kết nối: " + err.toString(), "error");
                }).markClassInvoiceBulkPaid(logIds, activeInvoiceStudentId);
            });
        }

        function toggleClassStudentPayment(checkbox) {
            var logId = checkbox.getAttribute("data-logid");
            var isPaid = checkbox.checked;
            if (!activeInvoiceStudentId) return;
            
            checkbox.disabled = true;
            showSyncToast('pending');
            
            google.script.run.withSuccessHandler(function(res) {
                checkbox.disabled = false;
                if (res && res.success) {
                    showSyncToast('success');
                    activeClassLessonLogs.forEach(function(log) {
                        if (log.logId === logId) {
                            if (!log.studentNotes) log.studentNotes = {};
                            if (!log.studentNotes[activeInvoiceStudentId]) {
                                log.studentNotes[activeInvoiceStudentId] = {};
                            }
                            log.studentNotes[activeInvoiceStudentId].paid = isPaid;
                        }
                    });
                    
                    var student = activeStudents.find(function(s) { return s.studentId === activeInvoiceStudentId; });
                    if (student) renderClassStudentInvoice(student);
                    
                    renderRosterAndEvalGrid();
                    renderClassLessonLogsTableUI();

                    if (currentTutorData) {
                        sessionStorage.setItem("classTutorData", JSON.stringify(currentTutorData));
                        localStorage.setItem("classTutorData", JSON.stringify(currentTutorData));
                    }
                } else {
                    showSyncToast('error');
                    checkbox.checked = !isPaid;
                    showToast("Lỗi đồng bộ: " + (res.error || "Không xác định"), "error");
                }
            }).withFailureHandler(function(err) {
                showSyncToast('error');
                checkbox.disabled = false;
                checkbox.checked = !isPaid;
                showToast("Lỗi kết nối: " + err.toString(), "error");
            }).updateClassStudentPaymentStatus(logId, activeInvoiceStudentId, isPaid);
        }

        function exportClassInvoiceImage() {
            var element = document.getElementById("invoiceElement");
            var student = activeStudents.find(function(s) { return s.studentId === activeInvoiceStudentId; });
            var name = student ? student.studentName : "HocSinh";
            
            html2canvas(element, { scale: 2, backgroundColor: "#FFFFFF", useCORS: true }).then(function(canvas) {
                var link = document.createElement('a');
                link.download = 'PhieuHocTap_' + name + '.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }

        function switchClassHwSubTab(subTab) {
            var form = document.getElementById("classHwAssignFormContainer");
            var list = document.getElementById("classHwListContainer");
            var btnUpload = document.getElementById("btnClassHwUploadTab");
            var btnList = document.getElementById("btnClassHwListTab");

            if (subTab === "upload") {
                form.style.display = "block";
                list.style.display = "none";
                btnUpload.style.background = "linear-gradient(135deg, #8E4DFF 0%, #5B21B6 100%)";
                btnUpload.style.border = "none";
                btnList.style.background = "rgba(255,255,255,0.06)";
                btnList.style.border = "1px solid rgba(255,255,255,0.15)";
            } else {
                form.style.display = "none";
                list.style.display = "block";
                btnList.style.background = "linear-gradient(135deg, #8E4DFF 0%, #5B21B6 100%)";
                btnList.style.border = "none";
                btnUpload.style.background = "rgba(255,255,255,0.06)";
                btnUpload.style.border = "1px solid rgba(255,255,255,0.15)";
                loadClassHomeworkList();
            }
        }

        function loadClassHomeworkList() {
            var cls = currentClasses[activeClassIndex];
            if (!cls) return;
            
            var tbody = document.getElementById("classHwTableBody");
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#A6ADCE; padding: 20px;"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải bài tập...</td></tr>';
            }
            
            google.script.run
                .withSuccessHandler(function(list) {
                    activeClassHomework = list || [];
                    renderClassHomeworkListUI();
                })
                .withFailureHandler(function(err) {
                    showToast("Không thể tải danh sách bài tập: " + err.toString(), "error");
                })
                .getClassHomeworkList(cls.classId, cls.className);
        }

        function handleClassHwFileSelect(e) {
            var file = e.target.files[0];
            if (!file) return;
            
            var reader = new FileReader();
            reader.onload = function(evt) {
                var base64 = evt.target.result.split(',')[1];
                selectedClassHwFile = {
                    fileName: file.name,
                    mimeType: file.type || "application/octet-stream",
                    base64: base64
                };
                
                document.getElementById("classSelectedFileName").innerText = file.name;
                document.getElementById("classSelectedFileBox").style.display = "flex";
                document.getElementById("classHwUploadArea").style.display = "none";
            };
            reader.readAsDataURL(file);
        }

        function clearClassSelectedFile() {
            selectedClassHwFile = null;
            document.getElementById("classHwFileInput").value = "";
            document.getElementById("classSelectedFileBox").style.display = "none";
            document.getElementById("classHwUploadArea").style.display = "block";
        }

        function resetClassHwForm() {
            document.getElementById("classHwTitle").value = "";
            document.getElementById("classHwReleaseDate").value = "";
            document.getElementById("classHwLink").value = "";
            clearClassSelectedFile();
        }

        function submitClassAssignedHomework() {
            var cls = currentClasses[activeClassIndex];
            if (!cls) {
                showToast("Vui lòng tạo hoặc chọn lớp học trước!", "error");
                return;
            }

            var title = document.getElementById("classHwTitle").value.trim();
            var releaseDate = document.getElementById("classHwReleaseDate").value.trim();
            var link = document.getElementById("classHwLink").value.trim();

            if (!title) {
                showToast("Vui lòng nhập tên bài tập!", "error");
                return;
            }

            var btn = document.getElementById("btnSubmitClassAssignedHw");
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang giao bài...';
            }

            var tempHwId = "HW_LH_" + new Date().getTime();
            var newHw = {
                hwId: tempHwId,
                classId: cls.classId,
                className: cls.className,
                title: title,
                releaseDate: releaseDate || new Date().toLocaleDateString('vi-VN'),
                fileUrl: "",
                fileName: selectedClassHwFile ? selectedClassHwFile.fileName : "",
                link: link
            };

            showSyncToast('pending');
            google.script.run
                .withSuccessHandler(function(res) {
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = "Giao bài";
                    }
                    if (res && res.success) {
                        showSyncToast('success');
                        showToast("Đăng bài tập thành công!", "success");
                        
                        var savedHw = {
                            hwId: res.hwId,
                            classId: cls.classId,
                            className: cls.className,
                            title: title,
                            releaseDate: releaseDate || new Date().toLocaleDateString('vi-VN'),
                            fileUrl: res.fileUrl || "",
                            fileName: res.fileName || "",
                            link: link
                        };
                        
                        if (!activeClassHomework) activeClassHomework = [];
                        activeClassHomework.unshift(savedHw);
                        
                        resetClassHwForm();
                        switchClassHwSubTab("list");
                        renderClassHomeworkListUI();
                    } else {
                        showSyncToast('error');
                        showToast("Lỗi: " + (res ? res.error : "Không thể giao bài tập"), "error");
                    }
                })
                .withFailureHandler(function(err) {
                    showSyncToast('error');
                    if (btn) {
                        btn.disabled = false;
                        btn.innerHTML = "Giao bài";
                    }
                    showToast("Lỗi kết nối: " + err.toString(), "error");
                })
                .saveClassHomework(cls.classId, cls.className, title, releaseDate, selectedClassHwFile, link);
        }

        function renderClassHomeworkListUI() {
            var cls = currentClasses[activeClassIndex];
            var tbody = document.getElementById("classHwTableBody");
            if (!cls || !tbody) return;

            if (!activeClassHomework || !Array.isArray(activeClassHomework) || activeClassHomework.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#A6ADCE; padding:20px;">Lớp này chưa có bài tập nào được giao.</td></tr>';
                return;
            }

            tbody.innerHTML = activeClassHomework.map(function(hw) {
                var attachStr = "";
                if (hw.fileUrl) {
                    attachStr += '<a href="' + hw.fileUrl + '" target="_blank" style="color:#8E4DFF; font-weight:700; text-decoration:none; margin-right:10px;"><i class="fa-solid fa-paperclip"></i> ' + (hw.fileName || "Tải file") + '</a>';
                }
                if (hw.link) {
                    attachStr += '<a href="' + hw.link + '" target="_blank" style="color:#10B981; font-weight:700; text-decoration:none;"><i class="fa-solid fa-link"></i> Xem link</a>';
                }
                if (!attachStr) attachStr = '<span style="color:#A6ADCE;">Không có</span>';

                return '<tr>' +
                    '<td style="color:#A6ADCE; font-weight:600;">' + (hw.releaseDate || '-') + '</td>' +
                    '<td style="font-weight:700; color:#FFD23F;">' + hw.title + '</td>' +
                    '<td>' + attachStr + '</td>' +
                    '<td style="text-align:center;"><button onclick="deleteClassHomework(\'' + hw.hwId + '\')" style="background:none; border:none; color:#EF4444; cursor:pointer; font-size:15px;" title="Xóa bài tập"><i class="fa-solid fa-trash"></i></button></td>' +
                '</tr>';
            }).join('');
        }

        function deleteClassHomework(hwId) {
            showCustomConfirm("Bạn có chắc chắn muốn xóa bài tập này?", function() {
                // OPTIMISTIC UI: Xóa khỏi mảng và render lại UI ngay 0.05s!
                activeClassHomework = activeClassHomework.filter(function(hw) { return hw.hwId !== hwId; });
                renderClassHomeworkListUI();

                showSyncToast('pending');
                // Gửi ngầm bên dưới
                google.script.run.withSuccessHandler(function() { showSyncToast('success'); }).deleteClassHomework(hwId);});
        }

        function openTrashModal() {
            var body = document.getElementById("trashModalBody");
            openModal("classTrashModal");
            if (body) body.innerHTML = '<div style="text-align: center; color: #A6ADCE; padding: 40px;"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải danh sách mục đã xóa...</div>';
            
            var phone = currentTutorData ? (currentTutorData.tutorPhone || "") : "";
            var code = currentTutorData ? (currentTutorData.tutorCode || "") : "";
            
            google.script.run.withSuccessHandler(function(items) {
                if (!items || !Array.isArray(items) || items.length === 0) {
                    body.innerHTML = '<div style="text-align: center; color: #10B981; padding: 40px; font-weight: bold;"><i class="fa-solid fa-circle-check" style="font-size: 32px; display: block; margin-bottom: 10px;"></i> Thùng rác trống! Không có mục nào bị xóa.</div>';
                    return;
                }
                
                var html = '<table style="width: 100%; border-collapse: collapse; color: #FFF; font-size: 13.5px;">' +
                    '<thead><tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: #A6ADCE; font-weight: bold;"><td style="padding: 10px;">Loại mục</td><td style="padding: 10px;">Tên / Nội dung</td><td style="padding: 10px;">Ngày xóa</td><td style="padding: 10px; text-align: center;">Thao tác</td></tr></thead><tbody>';
                
                items.forEach(function(item) {
                    var typeText = item.type === 'class' ? '<span style="color:#8E4DFF; font-weight:bold;">[Lớp học]</span>' : (item.type === 'student' ? '<span style="color:#3B82F6; font-weight:bold;">[Học sinh]</span>' : '<span style="color:#F59E0B; font-weight:bold;">[Buổi học]</span>');
                    html += '<tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">' +
                        '<td style="padding: 12px 10px;">' + typeText + '</td>' +
                        '<td style="padding: 12px 10px;"><strong>' + item.name + '</strong><br><small style="color:#A6ADCE;">' + (item.detail || "") + '</small></td>' +
                        '<td style="padding: 12px 10px; color:#A6ADCE;">' + (item.deletedAt || "") + '</td>' +
                        '<td style="padding: 12px 10px; text-align: center; vertical-align:middle; white-space:nowrap;">' +
                            '<div style="display:inline-flex; gap:8px; justify-content:center; align-items:center;">' +
                                '<button onclick="restoreTrashItem(\'' + item.type + '\', \'' + item.id + '\', \'' + (item.className || "") + '\')" style="padding: 6px 14px; background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; border-radius: 8px; color: #10B981; font-weight: bold; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-rotate-left"></i> Phục hồi</button>' +
                                '<button onclick="purgeTrashItem(\'' + item.type + '\', \'' + item.id + '\', \'' + (item.className || "") + '\')" style="padding: 6px 14px; background: rgba(239, 68, 68, 0.2); border: 1px solid #EF4444; border-radius: 8px; color: #EF4444; font-weight: bold; cursor: pointer; font-size: 12px;"><i class="fa-solid fa-trash"></i> Xóa vĩnh viễn</button>' +
                            '</div>' +
                        '</td>' +
                    '</tr>';
                });
                
                html += '</tbody></table>';
                body.innerHTML = html;
            }).withFailureHandler(function(err) {
                body.innerHTML = '<div style="color: #EF4444; padding: 20px; text-align: center;">Lỗi tải thùng rác: ' + err.toString() + '</div>';
            }).getClassTrashItems(phone, code);
        }

        function restoreTrashItem(type, itemId, className) {
            showSyncToast('pending');
            google.script.run.withSuccessHandler(function(res) {
                if (res && res.success) {
                    showSyncToast('success');
                    openTrashModal();
                    var phone = currentTutorData ? (currentTutorData.tutorPhone || "") : "";
                    var code = currentTutorData ? (currentTutorData.tutorCode || "") : "";
                    loadClassDashboardData(phone, null, code);
                } else {
                    showSyncToast('error');
                    showToast("Lỗi phục hồi: " + (res.error || "Thất bại"), "error");
                }
            }).restoreClassItem(type, itemId, className);
        }

        function purgeTrashItem(type, itemId, className) {
            showCustomConfirm("Bạn có chắc chắn muốn XÓA VĨNH VIỄN mục này khỏi hệ thống? Không thể khôi phục sau khi xóa!", function() {
                showSyncToast('pending');
                google.script.run.withSuccessHandler(function(res) {
                    if (res && res.success) {
                        showSyncToast('success');
                        openTrashModal();
                    } else {
                        showSyncToast('error');
                        showToast("Lỗi xóa: " + (res.error || "Thất bại"), "error");
                    }
                }).purgeClassItem(type, itemId, className);
            });
        }

        function logoutClass() {
            sessionStorage.removeItem("classTutorData");
            sessionStorage.removeItem("userTutorData");
            sessionStorage.removeItem("userPhone");
            localStorage.removeItem("classTutorData");
            localStorage.removeItem("userTutorData");
            localStorage.removeItem("userPhone");
            window.location.href = "class-login.html";
        }
    
