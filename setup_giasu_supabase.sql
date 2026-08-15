-- ============================================================
-- SQL TẠO BẢNG & NHẬP 100% DỮ LIỆU GỐC HỆ THỐNG GIA SƯ (gs_*)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gs_tutors (
    tutor_id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT UNIQUE,
    pin TEXT,
    qr_url TEXT,
    registered_date TEXT,
    next_due_date TEXT,
    last_active TEXT,
    status TEXT DEFAULT 'Hoạt động',
    account_type TEXT DEFAULT 'Gia sư (1-1)',
    deleted_date TEXT
);
ALTER TABLE public.gs_tutors DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.gs_admins (
    admin_id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT UNIQUE,
    pin TEXT
);
ALTER TABLE public.gs_admins DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.gs_students (
    student_id TEXT PRIMARY KEY,
    student_name TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    tutor_phone TEXT,
    tuition_fee NUMERIC,
    homework_id TEXT,
    announcement TEXT,
    deleted_date TEXT
);
ALTER TABLE public.gs_students DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.gs_evaluations (
    eval_id TEXT PRIMARY KEY,
    student_phone TEXT,
    student_name TEXT,
    tutor_phone TEXT,
    week_num TEXT,
    study_date TEXT,
    subject TEXT,
    lesson_content TEXT,
    hw_eval TEXT,
    entry_test TEXT,
    term_test TEXT,
    attendance_status TEXT,
    paid_status TEXT,
    paid_date TEXT,
    deleted_date TEXT
);
ALTER TABLE public.gs_evaluations DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.gs_schedules (
    schedule_id TEXT PRIMARY KEY,
    tutor_phone TEXT,
    tutor_name TEXT,
    student_name TEXT,
    mon TEXT,
    tue TEXT,
    wed TEXT,
    thu TEXT,
    fri TEXT,
    sat TEXT,
    sun TEXT
);
ALTER TABLE public.gs_schedules DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.gs_homework (
    hw_id TEXT PRIMARY KEY,
    student_name TEXT,
    hw_name TEXT,
    release_date TEXT,
    file_url TEXT,
    homework_code TEXT,
    status TEXT DEFAULT 'Active',
    tutor_phone TEXT,
    external_link TEXT,
    deleted_date TEXT
);
ALTER TABLE public.gs_homework DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.gs_submissions (
    submission_id TEXT PRIMARY KEY,
    submitted_at TEXT,
    student_name TEXT,
    lesson_name TEXT,
    file_url TEXT,
    homework_code TEXT,
    submission_date TEXT,
    status TEXT DEFAULT 'Active',
    score NUMERIC,
    comment TEXT
);
ALTER TABLE public.gs_submissions DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.gs_feedbacks (
    feedback_id TEXT PRIMARY KEY,
    submitted_at TEXT,
    student_phone TEXT,
    student_name TEXT,
    content TEXT
);
ALTER TABLE public.gs_feedbacks DISABLE ROW LEVEL SECURITY;

INSERT INTO public.gs_tutors (tutor_id, name, phone, pin, qr_url, registered_date, next_due_date, last_active, account_type) VALUES ('0975546830', 'Dũng', '0975546830', '1234', 'https://i.postimg.cc/Zn8NjRbg/ma-qr-chuyen-khoan-ZN.jpg', '18/07/2026', '18/09/2026', '12/08/2026 18:31', 'Gia sư (1-1)') ON CONFLICT (tutor_id) DO UPDATE SET name=EXCLUDED.name, pin=EXCLUDED.pin, qr_url=EXCLUDED.qr_url;
INSERT INTO public.gs_tutors (tutor_id, name, phone, pin, qr_url, registered_date, next_due_date, last_active, account_type) VALUES ('0334906085', 'Nguyễn Đoàn Ngọc Anh', '0334906085', '200120', 'https://i.postimg.cc/J09D4hRv/na.jpg', '18/07/2026', '18/08/2026', '23/07/2026 12:49', 'Gia sư (1-1)') ON CONFLICT (tutor_id) DO UPDATE SET name=EXCLUDED.name, pin=EXCLUDED.pin, qr_url=EXCLUDED.qr_url;
INSERT INTO public.gs_tutors (tutor_id, name, phone, pin, qr_url, registered_date, next_due_date, last_active, account_type) VALUES ('0824231314', 'Đồng Quang Minh', '0824231314', '1314', 'https://i.postimg.cc/SRC9LhRp/te.jpg', '23/07/2026', '23/08/2026', NULL, 'Giáo viên Lớp học') ON CONFLICT (tutor_id) DO UPDATE SET name=EXCLUDED.name, pin=EXCLUDED.pin, qr_url=EXCLUDED.qr_url;
INSERT INTO public.gs_admins (admin_id, name, phone, pin) VALUES ('302001', 'Quản trị viên', '302001', '1234') ON CONFLICT (admin_id) DO UPDATE SET name=EXCLUDED.name, pin=EXCLUDED.pin;
INSERT INTO public.gs_students (student_id, student_name, parent_name, parent_phone, tutor_phone, tuition_fee, homework_id, announcement) VALUES ('0909799481', 'Gia Thái', 'Thu', '0909799481', '0975546830', 225000, '0909799481', 'Tuần sau học sinh Gia Thái về quê nên chuyển học offline sang online') ON CONFLICT (student_id) DO UPDATE SET student_name=EXCLUDED.student_name, tuition_fee=EXCLUDED.tuition_fee, announcement=EXCLUDED.announcement;
INSERT INTO public.gs_students (student_id, student_name, parent_name, parent_phone, tutor_phone, tuition_fee, homework_id, announcement) VALUES ('0936276277', 'Anh Đức', 'Thanh Thảo', '0936276277', '0975546830', 190000, '0929396398', 'Chủ Nhật tuần này sẽ có bài kiểm tra định kì') ON CONFLICT (student_id) DO UPDATE SET student_name=EXCLUDED.student_name, tuition_fee=EXCLUDED.tuition_fee, announcement=EXCLUDED.announcement;
INSERT INTO public.gs_students (student_id, student_name, parent_name, parent_phone, tutor_phone, tuition_fee, homework_id, announcement) VALUES ('0908681828', 'Ngô Vy Anh', 'Nguyễn Phương Anh', '0908681828', '0334906085', 200000, '0908681828', NULL) ON CONFLICT (student_id) DO UPDATE SET student_name=EXCLUDED.student_name, tuition_fee=EXCLUDED.tuition_fee, announcement=EXCLUDED.announcement;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_1', '0909799481', 'Gia Thái', '1', '2026-06-08', 'Toán học', 'Chương 1: đơn thức, một phần chương 6: phân thức đại số                         Nhận xét: Bé học bài có tiến bộ, tuy nhiên làm bài sai do làm ẩu nhiều đa số là các phép tính tay vẫn còn làm chậm và hay nhìn nhầm dẫn đến kết quả sai, cần cải thiện tính toán bằng tay hạn chế dùng máy tính nhiều', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_2', '0909799481', 'Gia Thái', '1', '2026-06-12', 'Toán học', 'Chương 2: Hằng đẳng thức. Nhận xét: bé tiếp thu bài khá tốt tuy nhiên nhiều bài tính tay còn sai, các phép tính cơ bản còn chậm và dễ sai, nên rèn luyện tư duy tính toán như các phép cộng, nhân, chia nhiều hơn để làm bài nhanh và tốt hơn', 'Thiếu', '7', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_3', '0909799481', 'Gia Thái', '2', '2026-06-15', 'Toán học', 'Chương 3: Tứ giác, hình thang, hình thang cân. Nhận xét: Bài hình học bé còn nhiều thứ quên, cần học thêm về hình, cần làm bài và bài tập thêm để luyện giải bài hình', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_4', '0909799481', 'Gia Thái', '2', '2026-06-19', 'Toán học', 'Phụ huynh xin nghỉ', 'Hoàn thành', 'Không có', 'Không có', 'Hủy/ nghỉ', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_5', '0909799481', 'Gia Thái', '3', '2026-06-22', 'Toán học', 'Ôn về các đường thẳng, góc, tam giác (lý thuyết). Nhận xét: bé tiếp thu bài khá tốt, buổi học kế tiếp sẽ kiểm tra bài và kiểm tra đầu giờ, phụ huynh nhớ nhắc bé học bài', 'Thiếu', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_6', '0909799481', 'Gia Thái', '3', '2026-06-24', 'Toán học', 'Ôn về các đường thẳng, góc (bài tập). Nhận xét: bé có học bài nhưng còn chưa hiểu rõ nên chỉ làm được vài bài cơ bản, phụ huynh nhớ nhắc nhở em học bài và làm bài tập thứ 6 kiểm tra bài cũ', 'Hoàn thành', '7', 'Không có', 'Học bù', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_7', '0909799481', 'Gia Thái', '3', '2026-06-26', 'Toán học', 'Kiểm tra định kì: lý thuyết hình lớp 7. Nhận xét: Bé lần này kiểm tra điểm tương đối thấp, có nhiều kiến thức đã quên, cần phải ôn tập đi, ôn tập lại kiến thức đã mất để học tiếp chương trình lớp 8)', 'Hoàn thành', 'Không có', '2026-06-06 00:00:00', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_8', '0909799481', 'Gia Thái', '4', '2026-06-29', 'Toán học', 'Làm bài kiểm tra hình lớp 7. Nhận xét: em học có tiến bộ tuy nhiên vẫn còn nhiều phần hay quên và sai một số lỗi cơ bản, cần ôn tập lại lý thuyết nhiều hơn và làm bài tập', 'Hoàn thành', '7', '7', 'Đã học', 'Đã đóng', '2026-06-29') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_9', '0909799481', 'Gia Thái', '4', '2026-07-03', 'Toán học', 'Toán lớp 7: chứng minh hai tam giác bằng nhau. Nhận xét: em vẫn còn làm sai nhiều bài, vẫn chưa biết cách chứng minh, nhìn hình còn chưa tốt, tuy nhiên em vẫn tiếp thu khá tốt nhưng còn chậm, cần phải học bài lý thuyết thêm, làm bài tập kĩ', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_10', '0909799481', 'Gia Thái', '5', '2026-07-06', 'Toán học', 'Toán lớp  7: Chứng minh hai tam giác bằng nhau (c-c-c, c-g-c). Nhận xét: hôm nay em tiếp thu bài rất tốt, học nhanh, hiểu nhanh có vẻ như em quyết tâm học để về quê', 'Thiếu 1 bài', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_11', '0909799481', 'Gia Thái', '5', '2026-07-10', 'Toán học', 'Làm bài kiểm tra định kì hình lớp 7. Nhận xét em làm bài khá tốt, hoàn thành tốt chương trình lớp 7', 'Hoàn thành', '2026-05-09 00:00:00', '7.15', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_12', '0909799481', 'Gia Thái', '6', '2026-07-13', 'Toán học', 'Gia sư xin nghỉ', 'Hoàn thành', 'Không có', 'Không có', 'Hủy/ nghỉ', NULL, '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_13', '0909799481', 'Gia Thái', '6', '2026-07-17', 'Toán học', 'Tứ giác, hình thang cân. Nhận xét: em hiểu bài và làm bài tốt, em đã lấy lại được gốc lớp 7 nên làm các bài lớp 8 trở nên suông sẻ hơn', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_14', '0909799481', 'Gia Thái', '6', '2026-07-18', 'Toán học', 'Làm bài tập hình thang cân. Nhận xét: Em làm bài khá tốt, tuy nhiên có một số bài làm còn sai, một số bài làm rồi vẫn còn quên. Cần làm nhiều bài tập hơn để rèn luyện cho quen', 'Hoàn thành', '8', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_15', '0909799481', 'Gia Thái', '7', '2026-07-20', 'Toán học', 'Học lý thuyết: Hình bình hành. Nhận xét: Em học bài tiếp thu nhanh, làm bài tốt nhưng vẫn còn có một số bài sai', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_16', '0909799481', 'Gia Thái', '7', '2026-07-22', 'Toán học', 'Làm bài tập của Hình bình hành. Nhận xét em học tốt nhưng vẫn còn có bài chưa biết làm cần rèn luyện làm thêm bài tập, thứ 6 tuần này sẽ kiểm tra miệng lý thuyết phụ huynh nhớ nhắc em học bài', 'Thiếu 1 bài', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_17', '0909799481', 'Gia Thái', '7', '2026-07-24', 'Toán học', 'Làm bài tập của Hình bình hành. Nhận xét em học tốt nhưng vẫn còn có bài chưa biết làm cần rèn luyện làm thêm bài tập, em vẫn còn hơi ham chơi nên nhắc nhở em chú ý học tập', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_18', '0909799481', 'Gia Thái', '8', '2026-07-27', 'Toán học', 'Học bài mới: Hình chữ nhật, làm bài tập hình chữ nhật và sửa lại bài cũ hình bình hành. Nhận xét: em làm bài khá tốt, đã biết nhìn hình, thứ 2 tuần sau sẽ có bài kiểm tra định kỳ phụ huynh nhớ nhắc nhở bé học bài', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_19', '0909799481', 'Gia Thái', '8', '2026-07-30', 'Toán học', 'Làm bài tập hình chữ nhật, học lý thuyết hình thoi. Nhận xét: em học bài tốt, thứ 7 có bài kiểm tra lý thuyết hình thang, hình thang cân, hình bình hành, hình chữ nhật, hình thoi phụ huynh nhớ nhắc em học bài', 'Thiếu 1 bài', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_20', '0909799481', 'Gia Thái', '8', '2026-08-01', 'Toán học', 'Làm bài tập hình thoi, kiểm tra lý thuyết. Nhận xét: em làm bài lý thuyết rất tốt, nhưng cần ôn lại bài thêm, làm bài tập nhiều hơn nữa', 'Hoàn thành', '2026-05-09 00:00:00', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_21', '0909799481', 'Gia Thái', '9', '2026-08-03', 'Toán học', 'Bài hình vuông, làm bài tập hình vuông. Nhận xét: buổi kế tiếp học bài về định lý talet, bài rất khó, phụ huynh nhớ nhắc em xem bài trước', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', NULL, '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_22', '0909799481', 'Gia Thái', '9', '2026-08-05', 'Toán học', 'Học bài định lý thales. Nhận xét: em tiếp thu bài khá tốt, làm bài tập vẫn ổn nhưng vẫn nên ôn bài và làm bài tập nhiều hơn để rèn luyện thêm', 'Thiếu 1 bài', 'Không có', 'Không có', 'Đã học', NULL, '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_23', '0909799481', 'Gia Thái', '9', '2026-08-07', 'Toán học', 'Học bài: Đường trung bình, đường phân giác, làm bài tập cũ em chưa biết làm. Nhận xét: tuần sau kiểm tra bài tập và lý thuyết đã học onl, phụ huynh nhớ nhắc nhở em ôn bài', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', NULL, '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_24', '0909799481', 'Gia Thái', '10', '2026-08-12', 'Toán học', 'Kiểm tra định kỳ lần cuối của lớp 8. Nhận xét: em làm bài khá tệ, lần kiểm tra lý thuyết với hình tứ giác em làm tốt, nhưng qua định lý Thales thì em lại không làm được do không học bài, phụ huynh nhắc nhở em học bài lý thuyết nhiều hơn', 'Hoàn thành', 'Không có', '2026-07-07 00:00:00', 'Đã học', NULL, '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0909799481_25', '0909799481', 'Gia Thái', '10', '2026-08-12', 'Toán học', 'Hôm nay mưa bão nên sẽ nghỉ học một buổi', 'Hoàn thành', 'Không có', 'Không có', 'Hủy/ nghỉ', NULL, '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0936276277_32', '0936276277', 'Anh Đức', '0', '2026-06-26', 'Vật lý', 'Bài 1: Cấu trúc của chất. Nhận xét: Em học bài và hiểu bài tốt', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0936276277_33', '0936276277', 'Anh Đức', '1', '2026-07-01', 'Vật lý', 'Sửa bài tập 1, học lý thuyết bài 2. Nhận xét: Em có học bài cũ, tuy nhiên vẫn còn vài cái quên, cần nên ôn tập nhiều hơn, phụ huynh nhớ nhắc nhở em học lý thuyết để buổi sau kiểm tra bài cũ', 'Hoàn thành', '8', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0936276277_34', '0936276277', 'Anh Đức', '1', '2026-07-03', 'Vật lý', 'Bài 2: Nội năng và nhiệt động lực học 1. Em tiếp thu và học bài tốt, tuy nhiên các bài liên quan tới tính toán vẫn còn làm sai nhiều. Phụ huynh nên động viên em làm bài và học bài', 'Hoàn thành', '2026-05-08 00:00:00', 'Không có', 'Học bù', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0936276277_35', '0936276277', 'Anh Đức', '1', '2026-07-04', 'Vật lý', 'Gia sư xin nghỉ', 'Hoàn thành', 'Không có', 'Không có', 'Hủy/ nghỉ', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0936276277_36', '0936276277', 'Anh Đức', '2', '2026-07-08', 'Vật lý', 'Làm bài tập 2 giải quyết một số bài toán, lý thuyết bài 2. Nhận xét: em làm bài khá tốt nhưng vẫn còn sai nhiều phần tính toán, phụ huynh nên nhắc nhở em học bài lý thuyết nhiều hơn', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0936276277_37', '0936276277', 'Anh Đức', '2', '2026-07-15', 'Vật lý', 'Làm bài tập của bài 2. Nhận xét em làm bài khá tốt tuy nhiên vẫn còn một số bài sai', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0936276277_38', '0936276277', 'Anh Đức', '3', '2026-07-18', 'Vật lý', 'Làm bài tập bài 3 Thang nhiệt độ và nhiệt kế. Nhận xét: em còn làm sai khá nhiều bài, nên rèn luyện thêm các bài tập mà gia sư giao', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0936276277_39', '0936276277', 'Anh Đức', '4', '2026-07-22', 'Vật lý', 'Bài 3: Nhiệt độ và thang nhiệt độ, em còn nhiều bài làm sai và chưa thạo phương pháp làm bài, cần nên làm thêm bài, học lý thuyết, Chủ nhật tuần này sẽ có bài kiểm tra định kỳ gửi về phụ huynh', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0936276277_40', '0936276277', 'Anh Đức', '4', '2026-07-25', 'Vật lý', 'Học lý thuyết bài 4: Nhiệt dung riêng', 'Hoàn thành', 'Không có', '9.33', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0936276277_41', '0936276277', 'Anh Đức', '5', '2026-07-29', 'Vật lý', 'Làm bài tập bài 4: Nhiệt dung riêng. Nhận xét: Em có vẻ như vẫn còn khá yếu làm bài tập, Phụ Huynh nhớ nhắc em làm bài và học để chủ nhật làm bài kiểm tra', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0936276277_42', '0936276277', 'Anh Đức', '5', '2026-08-01', 'Vật lý', 'Làm bài tập bài 4. Nhận xét: em vẫn còn làm bài tập khá yếu, bài làm còn chậm, cần rèn luyện thêm nhiều bài tập hơn, dời lịch kiểm tra vào ngày thứ 3 để em dễ ôn bài', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0936276277_43', '0936276277', 'Anh Đức', '6', '2026-08-05', 'Vật lý', 'Bài 5: Nhiệt nóng chảy riêng, Nhận xét: em tiếp thu bài ổn, tuy nhiên còn vẫn khá yếu khoản làm bài tập, phụ huynh nhớ nhắc em xem lại cách làm bài của bài 5', 'Thiếu 1 bài', '8', '8', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0936276277_44', '0936276277', 'Anh Đức', '6', '2026-08-08', 'Vật lý', 'Làm bài tập nhiệt nóng chảy riêng , Nhận xét: em tiếp thu bài ổn, tuy nhiên còn vẫn khá yếu khoản làm bài tập, phụ huynh nhớ nhắc em xem lại cách làm bài của bài 5', 'Hoàn thành', 'Không có', 'Không có', 'Đã học', 'Đã đóng', '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_evaluations (eval_id, student_phone, student_name, week_num, study_date, subject, lesson_content, hw_eval, entry_test, term_test, attendance_status, paid_status, paid_date) VALUES ('EVAL_0936276277_45', '0936276277', 'Anh Đức', '7', '2026-08-12', 'Vật lý', 'Làm bài tập nhiệt nóng chảy riêng còn lại, Nhận xét em làm bài tốt, hôm sau học bài kế tiếp nhiệt hóa hơi riêng', 'Phụ huynh nhớ nhắc nhở bé làm bài tập gia sư mới giao', 'Không có', 'Không có', 'Đã học', NULL, '') ON CONFLICT (eval_id) DO NOTHING;
INSERT INTO public.gs_schedules (schedule_id, tutor_phone, tutor_name, student_name, mon, tue, wed, thu, fri, sat, sun) VALUES ('SCH_0975546830_1', '0975546830', 'Dũng', 'Gia Thái', '19:00 - 21:00', NULL, '19:00 - 21:00', NULL, '19:00 - 21:00', NULL, NULL) ON CONFLICT (schedule_id) DO NOTHING;
INSERT INTO public.gs_schedules (schedule_id, tutor_phone, tutor_name, student_name, mon, tue, wed, thu, fri, sat, sun) VALUES ('SCH_0975546830_2', '0975546830', 'Dũng', 'Anh Đức', NULL, NULL, '14:00 - 15:30 (Vật Lý)', NULL, NULL, '14:00 - 15:30 (Vật Lý)', NULL) ON CONFLICT (schedule_id) DO NOTHING;
INSERT INTO public.gs_schedules (schedule_id, tutor_phone, tutor_name, student_name, mon, tue, wed, thu, fri, sat, sun) VALUES ('SCH_0334906085_3', '0334906085', 'Nguyễn Đoàn Ngọc Anh', 'Ngô Vy Anh', '8:30 - 10:30', NULL, '8:30 - 10:30', NULL, NULL, NULL, NULL) ON CONFLICT (schedule_id) DO NOTHING;
INSERT INTO public.gs_homework (hw_id, student_name, hw_name, release_date, file_url, homework_code, status, tutor_phone, external_link) VALUES ('HW_GS_2', 'Anh Đức', 'Bài tập bài 3', '23/07/2026', 'https://drive.google.com/file/d/1sarlcbxOUrtiuw5w-oWot7LAOLbG8htM/view?usp=drivesdk', '929396398', 'Active', '0975546830', NULL) ON CONFLICT (hw_id) DO NOTHING;
INSERT INTO public.gs_homework (hw_id, student_name, hw_name, release_date, file_url, homework_code, status, tutor_phone, external_link) VALUES ('HW_GS_5', 'Anh Đức', 'Bài tập bài 3', '24/07/2026', 'https://drive.google.com/file/d/1WvY-uBbLhaLQ63ndLhNvNmwURn6sj3C0/view?usp=drivesdk', '929396398', 'Active', '0975546830', NULL) ON CONFLICT (hw_id) DO NOTHING;
INSERT INTO public.gs_homework (hw_id, student_name, hw_name, release_date, file_url, homework_code, status, tutor_phone, external_link) VALUES ('HW_GS_6', 'Anh Đức', 'Bài kiểm tra định kỳ 1', '2026-07-25', NULL, '929396398', 'Active', '0975546830', 'https://azota.vn/de-thi/aepdmi') ON CONFLICT (hw_id) DO NOTHING;
INSERT INTO public.gs_homework (hw_id, student_name, hw_name, release_date, file_url, homework_code, status, tutor_phone, external_link) VALUES ('HW_GS_7', 'Anh Đức', 'Kiểm tra bài tập 1-4', '2026-08-03', NULL, '929396398', 'Active', '0975546830', 'https://azota.vn/de-thi/tvja5j') ON CONFLICT (hw_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_1', '2026-07-17 18:24:47', 'Gia Thái', 'Ngày 17 tháng 7 năm 2026 : Hình thang , hình thang cân', 'https://drive.google.com/file/d/1u-S0_srFFJgA_8dtAJtnoBwbLFIjp6af/view?usp=drivesdk', '0909799481', '2026-07-17', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_2', '2026-07-17 21:41:43', 'Anh Đức', 'Bài tập biến thiên nội năng', 'https://docs.google.com/document/d/1Vqzt6t1L5iLCMHy3eiguk-lk6DSzfyaU/edit?usp=drivesdk&ouid=115009141225951148177&rtpof=true&sd=true', '0929396398', '2026-07-17', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_3', '2026-07-19 20:41:11', 'Gia Thái', 'Ngày 19 tháng 7 năm 2026 Hình thang ,  hình thang cân', 'https://drive.google.com/file/d/1_LNCYPQBoRg_BL6g3K7hXRUpIs-XgNNg/view?usp=drivesdk', '0909799481', '2026-07-19', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_4', '2026-07-22 10:07:28', 'Anh Đức', 'Nhiệt độ', 'https://drive.google.com/file/d/1neUlzRnvo4CjXXlZ6Tj5coWiIdN5oCxo/view?usp=drivesdk', '0929396398', '2026-07-22', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_5', '2026-07-22 14:26:01', 'Gia Thái', 'Hình bình hành', 'https://drive.google.com/file/d/1Zc5ewev7w2Xw_-_n_f_10vcRY03D5CCz/view?usp=drivesdk', '0909799481', '2026-07-22', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_6', '2026-07-22 14:28:08', 'Gia Thái', 'Hình bình hành', 'https://drive.google.com/file/d/1a9nzUJfw7FOvN-ZzVkzjmudcDsUc-cZa/view?usp=drivesdk', '0909799481', '2026-07-22', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_7', '2026-07-24 13:31:15', 'Gia Thái', 'Hình bình hành', 'https://drive.google.com/file/d/17IrTczegqOdb0M_wxDOfLODcRskPtzRo/view?usp=drivesdk', '0909799481', '2026-07-24', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_8', '2026-07-27 14:30:23', 'Gia Thái', 'Hình bình hành', 'https://drive.google.com/file/d/1llm6SrCbxC0TSH56fC_ySNVuotfggh3f/view?usp=drivesdk', '0909799481', '2026-07-27', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_9', '2026-07-29 15:33:08', 'Gia Thái', 'Hình chữ Nhật', 'https://drive.google.com/file/d/1xwA015BXEjzj6MGSX-iFm7rc-k_me6CL/view?usp=drivesdk', '0909799481', '2026-07-29', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_10', '2026-07-31 15:46:44', 'Anh Đức', 'bài nhiệt dung', 'https://drive.google.com/file/d/15iZPpL4MMq9xx2Cb_shSEl_c2tA7Txr_/view?usp=drivesdk', '0929396398', '2026-07-31', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_11', '2026-08-03 16:44:46', 'Gia Thái', 'Hình thoi', 'https://drive.google.com/file/d/1Tni7KFJTcDS-zq70PJJFObnwsbFVaiZP/view?usp=drivesdk', '0909799481', '2026-08-03', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_12', '2026-08-04 20:12:38', 'Anh Đức', 'nhiệt dung riêng', 'https://drive.google.com/file/d/1Lxfxqm95VaOBdZmhRxtQAzAwv0b2-bjM/view?usp=drivesdk', '0929396398', '2026-08-04', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_13', '2026-08-05 14:41:22', 'Gia Thái', 'Hình vuông', 'https://drive.google.com/file/d/1LCphXg6VOF-O6_sEVbZS5oWEKWXXAYxq/view?usp=drivesdk', '0909799481', '2026-08-05', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_14', '2026-08-07 11:00:55', 'Gia Thái', 'Thales', 'https://drive.google.com/file/d/1C_NwS7kwoYAwBrOcpWuPyYqoOaVqMBdg/view?usp=drivesdk', '0909799481', '2026-08-07', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_15', '2026-08-08 09:41:55', 'Anh Đức', 'Nhiet nong chay', 'https://drive.google.com/file/d/1FQLyGyHut2M_a6i4D60CgT7-6LxI_jTe/view?usp=drivesdk', '0929396398', '2026-08-08', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_16', '2026-08-12 11:05:03', 'Anh Đức', 'nhiet nong chay rieng', 'https://drive.google.com/file/d/1p4omJdvqRNr0SWuNUcuy0H3IBTmUD2vs/view?usp=drivesdk', '0929396398', '2026-08-12', 'Active') ON CONFLICT (submission_id) DO NOTHING;
INSERT INTO public.gs_submissions (submission_id, submitted_at, student_name, lesson_name, file_url, homework_code, submission_date, status) VALUES ('SUB_GS_17', '2026-08-14 11:54:19', 'Gia Thái', 'Bài tập 12/8', 'https://drive.google.com/file/d/1mOs2iSxZ4whsKieXPav6nCA3uhoIOUy9/view?usp=drivesdk', '0909799481', '2026-08-14', 'Active') ON CONFLICT (submission_id) DO NOTHING;