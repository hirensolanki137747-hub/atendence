
(() => {
  const KEY='attendease_db_v1', SESSION='attendease_session';
  const today=()=>new Date().toISOString().slice(0,10);
  const seed=()=>({
    students:[
      {id:'MU2026001',name:'Aarav Patel',email:'aarav@example.com',phone:'9876543210',course:'B.Tech CSE',semester:'3'},
      {id:'MU2026002',name:'Diya Shah',email:'diya@example.com',phone:'9876543211',course:'B.Tech CSE',semester:'3'},
      {id:'MU2026003',name:'Krish Mehta',email:'krish@example.com',phone:'9876543212',course:'BCA',semester:'2'},
      {id:'MU2026004',name:'Mira Joshi',email:'mira@example.com',phone:'9876543213',course:'B.Tech IT',semester:'4'},
      {id:'MU2026005',name:'Reyansh Desai',email:'reyansh@example.com',phone:'9876543214',course:'BCA',semester:'2'}
    ], attendance:[]
  });
  const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||seed()}catch{return seed()}};
  const save=db=>localStorage.setItem(KEY,JSON.stringify(db));
  if(!localStorage.getItem(KEY)){const db=seed();save(db)}
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials=n=>String(n||'?').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase();
  const toast=msg=>{const el=$('toast');if(!el)return;el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600)};
  const pct=(a,b)=>b?Math.round(a/b*100):0;
  const statusBadge=s=>`<span class="status-badge ${s==='Present'?'status-present':'status-absent'}">${s}</span>`;
  const studentCell=s=>`<div class="student-cell"><span class="table-avatar">${initials(s.name)}</span><span><b>${esc(s.name)}</b><small>${esc(s.email)}</small></span></div>`;
  // Session is kept in several places so it survives page-to-page navigation
  // even when the browser isolates storage per file (file:// in Firefox/Safari)
  // or the page is opened in a new tab.
  const WN='attendease_session:';
  const session=()=>{
    for(const get of [()=>localStorage.getItem(SESSION),()=>sessionStorage.getItem(SESSION),()=>window.name.startsWith(WN)?window.name.slice(WN.length):null]){
      try{const v=get();if(v){const o=JSON.parse(v);if(o&&o.role)return o}}catch{}
    }
    return null;
  };
  const setSession=s=>{const v=JSON.stringify(s);
    try{localStorage.setItem(SESSION,v)}catch{}
    try{sessionStorage.setItem(SESSION,v)}catch{}
    window.name=WN+v;
  };
  const clearSession=()=>{
    try{localStorage.removeItem(SESSION)}catch{}
    try{sessionStorage.removeItem(SESSION)}catch{}
    if(window.name.startsWith(WN))window.name='';
  };
  const logout=()=>{clearSession();location.href='login.html'};
  const requireRole=role=>{const s=session();if(!s||s.role!==role){location.href='login.html';return null}return s};
  const setError=(id,msg)=>{const el=$(id);if(el)el.textContent=msg||''};
  const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validPhone=v=>/^[6-9]\d{9}$/.test(v);
  const emptyRow=(cols,msg)=>`<tr><td colspan="${cols}" style="text-align:center;color:#9aa3b5;padding:25px">${msg}</td></tr>`;
  function login(){
    $('loginForm')?.addEventListener('submit',e=>{
      e.preventDefault();const role=document.body.dataset.role, identity=$('loginEmail').value.trim(), password=$('loginPassword').value;
      setError('loginEmailError','');setError('loginPasswordError','');setError('loginError','');
      let ok=true;if(!identity){setError('loginEmailError',role==='admin'?'Email is required.':'Student ID is required.');ok=false}
      if(!password){setError('loginPasswordError','Password is required.');ok=false}
      if(!ok)return;
      if(role==='admin'){
        if(identity.toLowerCase()==='admin@attendease.com'&&password==='Admin@123'){setSession({role:'admin'});location.href='dashboard.html'}
        else setError('loginError','Incorrect admin email or password. Please try again.');
      }else{
        const s=load().students.find(x=>x.id.toLowerCase()===identity.toLowerCase());
        if(s&&password==='Student@123'){setSession({role:'student',studentId:s.id});location.href='dashboard.html'}
        else setError('loginError','Invalid student ID or password.');
      }
    });
    document.querySelector('[data-toggle-password]')?.addEventListener('click',e=>{const input=$('loginPassword');input.type=input.type==='password'?'text':'password';e.currentTarget.textContent=input.type==='password'?'Show':'Hide'});
  }
  function initShell(role){
    const s=requireRole(role);if(!s)return;
    document.querySelectorAll('[data-logout]').forEach(b=>b.addEventListener('click',()=>{clearSession();location.href='login.html'}));
    if($('todayLabel'))$('todayLabel').textContent=new Date().toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
    if(role==='student'){const st=load().students.find(x=>x.id===s.studentId);if(!st){clearSession();location.href='login.html';return}if($('sideName'))$('sideName').textContent=st.name}
    return s;
  }
  function adminDashboard(){
    const db=load(),date=today(),records=db.attendance.filter(x=>x.date===date),present=records.filter(x=>x.status==='Present').length,absent=records.filter(x=>x.status==='Absent').length,unmarked=Math.max(0,db.students.length-records.length),rate=pct(present,records.length);
    $('totalStudents').textContent=db.students.length;$('presentToday').textContent=present;$('absentToday').textContent=absent;$('attendanceRate').textContent=rate+'%';$('donutPercent').textContent=rate+'%';$('legendPresent').textContent=present;$('legendAbsent').textContent=absent;$('legendUnmarked').textContent=unmarked;$('attendanceDonut').style.background=`conic-gradient(var(--green) 0% ${rate}%, #e9edf4 ${rate}% 100%)`;
    $('recentStudents').innerHTML=db.students.slice(-5).reverse().map(s=>`<tr><td>${studentCell(s)}</td><td>${esc(s.id)}</td><td>${esc(s.course)}</td><td>${esc(s.semester)}</td></tr>`).join('')||emptyRow(4,'No students registered yet.');
  }
  function studentsPage(){
    const formPanel=$('studentFormPanel'),form=$('studentForm');
    const open=()=>{formPanel.hidden=false;formPanel.scrollIntoView({behavior:'smooth',block:'start'})};
    $('showStudentForm').onclick=()=>{form.reset();$('editStudentId').value='';$('studentFormTitle').textContent='Add new student';clearStudentErrors();open()};
    $('closeStudentForm').onclick=$('cancelStudentForm').onclick=()=>formPanel.hidden=true;
    const clearStudentErrors=()=>['studentId','studentName','studentEmail','studentPhone','studentCourse','studentSemester'].forEach(k=>setError(k+'Error',''));
    function render(){const db=load(),q=$('studentSearch').value.toLowerCase();const list=db.students.filter(s=>[s.name,s.id,s.email,s.course].some(v=>v.toLowerCase().includes(q)));$('studentCount').textContent=list.length;$('studentsTable').innerHTML=list.map(s=>`<tr><td>${studentCell(s)}</td><td>${esc(s.id)}</td><td>${esc(s.course)}</td><td>${esc(s.semester)}</td><td>${esc(s.phone)}</td><td><button class="text-link" data-edit="${esc(s.id)}">Edit</button> &nbsp; <button class="text-link danger" data-delete="${esc(s.id)}">Delete</button></td></tr>`).join('');$('studentsEmpty').hidden=list.length>0;
      document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{const st=load().students.find(x=>x.id===b.dataset.edit);$('editStudentId').value=st.id;$('studentId').value=st.id;$('studentId').disabled=true;$('studentName').value=st.name;$('studentEmail').value=st.email;$('studentPhone').value=st.phone;$('studentCourse').value=st.course;$('studentSemester').value=st.semester;$('studentFormTitle').textContent='Edit student';clearStudentErrors();open()});
      document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{if(!confirm('Delete this student and their attendance records?'))return;const db=load();db.students=db.students.filter(x=>x.id!==b.dataset.delete);db.attendance=db.attendance.filter(x=>x.studentId!==b.dataset.delete);save(db);render();toast('Student deleted.')});
    }
    $('studentId').disabled=false;$('studentSearch').addEventListener('input',render);
    form.addEventListener('submit',e=>{e.preventDefault();clearStudentErrors();const v={id:$('studentId').value.trim().toUpperCase(),name:$('studentName').value.trim(),email:$('studentEmail').value.trim(),phone:$('studentPhone').value.trim(),course:$('studentCourse').value.trim(),semester:$('studentSemester').value};let ok=true;
      const err=(k,m)=>{setError(k+'Error',m);ok=false};
      if(!/^[A-Z0-9-]{4,15}$/.test(v.id))err('studentId','Use 4–15 letters/numbers.');if(v.name.length<2)err('studentName','Enter at least 2 characters.');if(!validEmail(v.email))err('studentEmail','Enter a valid email.');if(!validPhone(v.phone))err('studentPhone','Enter a valid 10-digit Indian mobile number.');if(!v.course)err('studentCourse','Course is required.');if(!v.semester)err('studentSemester','Select a semester.');
      const db=load(),editing=$('editStudentId').value;if(db.students.some(x=>x.id.toLowerCase()===v.id.toLowerCase()&&x.id!==editing))err('studentId','This student ID already exists.');if(!ok)return;
      if(editing){const st=db.students.find(x=>x.id===editing);Object.assign(st,{name:v.name,email:v.email,phone:v.phone,course:v.course,semester:v.semester})}else db.students.push(v);
      save(db);form.reset();$('studentId').disabled=false;$('editStudentId').value='';formPanel.hidden=true;render();toast(editing?'Student updated successfully.':'Student added successfully.');
    });render();
  }
  function attendancePage(){
    const dateInput=$('attendanceDate');dateInput.value=today();
    function render(){const db=load(),date=dateInput.value,course=$('attendanceCourse').value;const courses=[...new Set(db.students.map(s=>s.course))];$('attendanceCourse').innerHTML='<option value="">All courses</option>'+courses.map(c=>`<option ${c===course?'selected':''}>${esc(c)}</option>`).join('');
      const list=db.students.filter(s=>!course||s.course===course);$('attendanceTable').innerHTML=list.map(s=>{const r=db.attendance.find(a=>a.studentId===s.id&&a.date===date);return `<tr><td>${studentCell(s)}</td><td>${esc(s.id)}</td><td>${esc(s.course)}</td><td><select class="status-select" data-status="${esc(s.id)}"><option value="">Not marked</option><option ${r?.status==='Present'?'selected':''}>Present</option><option ${r?.status==='Absent'?'selected':''}>Absent</option></select></td></tr>`}).join('')||emptyRow(4,'No students found for this course.');$('attendanceEmpty').hidden=db.students.length>0}
    dateInput.addEventListener('change',render);$('attendanceCourse').addEventListener('change',render);
    $('markAllPresent').onclick=()=>document.querySelectorAll('[data-status]').forEach(x=>x.value='Present');
    $('saveAttendance').onclick=()=>{const db=load(),date=dateInput.value;if(!date){toast('Please select a date.');return}document.querySelectorAll('[data-status]').forEach(sel=>{const status=sel.value;if(!status)return;const studentId=sel.dataset.status;const old=db.attendance.find(a=>a.studentId===studentId&&a.date===date);if(old)old.status=status;else db.attendance.push({studentId,date,status,course:db.students.find(s=>s.id===studentId)?.course||''})});save(db);render();toast('Attendance saved successfully.')};
    render();
  }
  function reportsPage(){
    const db=load();$('reportStudent').innerHTML='<option value="">All students</option>'+db.students.map(s=>`<option value="${esc(s.id)}">${esc(s.name)} (${esc(s.id)})</option>`).join('');
    function filtered(){const d=load(),from=$('reportFrom').value,to=$('reportTo').value,id=$('reportStudent').value;return d.attendance.filter(a=>(!from||a.date>=from)&&(!to||a.date<=to)&&(!id||a.studentId===id)).sort((a,b)=>b.date.localeCompare(a.date))}
    function render(){const d=load(),rows=filtered();const p=rows.filter(x=>x.status==='Present').length,ab=rows.length-p;$('reportRecords').textContent=rows.length;$('reportPresent').textContent=p;$('reportAbsent').textContent=ab;$('reportRate').textContent=pct(p,rows.length)+'%';$('reportsTable').innerHTML=rows.map(a=>{const s=d.students.find(x=>x.id===a.studentId)||{name:'Deleted student',id:a.studentId,course:a.course||'—'};return `<tr><td>${esc(a.date)}</td><td>${esc(s.name)}</td><td>${esc(s.id)}</td><td>${esc(s.course)}</td><td>${statusBadge(a.status)}</td></tr>`}).join('')||emptyRow(5,'No attendance records match these filters.');$('reportsEmpty').hidden=rows.length>0}
    $('applyReport').onclick=render;$('reportFrom').onchange=render;$('reportTo').onchange=render;$('reportStudent').onchange=render;$('printReport').onclick=()=>window.print();
    $('exportCsv').onclick=()=>{const d=load(),rows=filtered();const lines=[['Date','Student Name','Student ID','Course','Status'],...rows.map(a=>{const s=d.students.find(x=>x.id===a.studentId)||{};return[a.date,s.name||'Deleted student',a.studentId,s.course||a.course||'',a.status]})];const csv=lines.map(r=>r.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(',')).join('\\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='attendance-report.csv';a.click();URL.revokeObjectURL(url);toast('CSV report downloaded.')};render();
  }
  function studentData(){const s=session(),db=load(),st=db.students.find(x=>x.id===s.studentId),records=db.attendance.filter(a=>a.studentId===st.id).sort((a,b)=>b.date.localeCompare(a.date));return{st,records,p:records.filter(a=>a.status==='Present').length,ab:records.filter(a=>a.status==='Absent').length}}
  function studentDashboard(){const {st,records,p,ab}=studentData(),rate=pct(p,records.length);$('studentWelcome').textContent='Welcome back, '+st.name.split(' ')[0]+' 👋';$('myTotal').textContent=records.length;$('myPresent').textContent=p;$('myAbsent').textContent=ab;$('myRate').textContent=rate+'%';$('myProgressText').textContent=rate+'%';$('myProgress').style.background=`conic-gradient(var(--blue) 0% ${rate}%,#edf0f6 ${rate}% 100%)`;$('attendanceMessage').textContent=rate>=75?'Great consistency!':rate?'Keep working towards 75%.':'Your attendance will appear here.';$('dashboardProfile').innerHTML=[['Student ID',st.id],['Email',st.email],['Course',st.course],['Semester',st.semester]].map(([k,v])=>`<div><span>${k}</span><b>${esc(v)}</b></div>`).join('');$('myRecent').innerHTML=records.slice(0,5).map(a=>`<tr><td>${esc(a.date)}</td><td>${esc(a.course||st.course)}</td><td>${statusBadge(a.status)}</td></tr>`).join('')||emptyRow(3,'No attendance records yet.');}
  function myAttendance(){const render=()=>{const {st,records}=studentData(),date=$('myDateFilter').value,status=$('myStatusFilter').value,rows=records.filter(a=>(!date||a.date===date)&&(!status||a.status===status));$('myAttendanceTable').innerHTML=rows.map(a=>`<tr><td>${esc(a.date)}</td><td>${esc(a.course||st.course)}</td><td>${statusBadge(a.status)}</td></tr>`).join('')||emptyRow(3,'No attendance records found.');$('myAttendanceEmpty').hidden=rows.length>0};$('myDateFilter').onchange=render;$('myStatusFilter').onchange=render;render();}
  function profilePage(){const {st}=studentData();$('profileAvatar').textContent=initials(st.name);$('profileNameHeading').textContent=st.name;$('profileIdHeading').textContent=st.id;$('profileId').value=st.id;$('profileName').value=st.name;$('profileEmail').value=st.email;$('profilePhone').value=st.phone;$('profileCourse').value=st.course;$('profileSemester').value=st.semester;$('profileForm').onsubmit=e=>{e.preventDefault();setError('profileEmailError','');setError('profilePhoneError','');let ok=true;if(!validEmail($('profileEmail').value.trim())){setError('profileEmailError','Enter a valid email.');ok=false}if(!validPhone($('profilePhone').value.trim())){setError('profilePhoneError','Enter a valid 10-digit mobile number.');ok=false}if(!ok)return;const db=load(),target=db.students.find(x=>x.id===st.id);target.email=$('profileEmail').value.trim();target.phone=$('profilePhone').value.trim();save(db);toast('Profile updated successfully.');};}
  function statisticsPage(){const {records,p,ab}=studentData(),rate=pct(p,records.length),now=new Date(),month=now.toISOString().slice(0,7),monthly=records.filter(x=>x.date.startsWith(month)),mP=monthly.filter(x=>x.status==='Present').length;$('statOverall').textContent=rate+'%';$('statPresent').textContent=p;$('statAbsent').textContent=ab;$('statMonth').textContent=pct(mP,monthly.length)+'%';$('studentDonutPercent').textContent=rate+'%';$('studentLegendPresent').textContent=p;$('studentLegendAbsent').textContent=ab;$('studentDonut').style.background=`conic-gradient(var(--green) 0% ${rate}%,var(--orange) ${rate}% 100%)`;
    const months=[];for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push({key:d.toISOString().slice(0,7),label:d.toLocaleDateString('en',{month:'short'})})}const max=Math.max(1,...months.map(m=>records.filter(x=>x.date.startsWith(m.key)).length));$('monthlyChart').innerHTML=months.map(m=>{const r=records.filter(x=>x.date.startsWith(m.key)),pr=r.filter(x=>x.status==='Present').length,abn=r.length-pr;return `<div class="bar-group"><div class="bars"><div class="bar present" style="height:${pr/max*100}%"></div><div class="bar absent" style="height:${abn/max*100}%"></div></div><span class="bar-label">${m.label}</span></div>`}).join('');
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const page=document.body.dataset.page,role=document.body.dataset.role;
    if(page==='login'){login();return}
    if(role==='admin'){if(!initShell('admin'))return;({dashboard:adminDashboard,students:studentsPage,attendance:attendancePage,reports:reportsPage}[page]||(()=>{}))()}
    if(role==='student'){if(!initShell('student'))return;({dashboard:studentDashboard,attendance:myAttendance,profile:profilePage,statistics:statisticsPage}[page]||(()=>{}))()}
  });
})();
