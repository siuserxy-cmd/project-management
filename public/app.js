// 全局变量
let projects = [];
let currentUser = null;
let uploadedFiles = [];
let uploadedImages = [];
let users = [];

// 状态样式映射
const statusStyles = {
    '待接单': 'status-waiting',
    '写作中': 'status-writing',
    '已完成': 'status-delivered',
    '已结算': 'status-settled'
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否已登录
    if (localStorage.getItem('currentUser')) {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
        showMainPage();
        loadData();
    }
});

// 显示注册表单
function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

// 显示登录表单
function showLogin() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

// 处理注册
async function handleRegister() {
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('registerRole').value;

    // 验证
    if (!username || !password || !role) {
        alert('请填写所有必填字段');
        return;
    }

    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }

    if (password.length < 6) {
        alert('密码长度至少6位');
        return;
    }

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            alert('注册成功！请登录');
            showLogin();
            // 清空表单
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            document.getElementById('registerRole').value = '';
        } else {
            alert(data.error || '注册失败');
        }
    } catch (error) {
        console.error('注册失败:', error);
        alert('注册失败，请重试');
    }
}

// 处理登录
async function handleLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMainPage();
            loadData();
        } else {
            alert(data.error || '登录失败');
        }
    } catch (error) {
        console.error('登录失败:', error);
        alert('登录失败，请重试');
    }
}

// 退出登录
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('mainPage').style.display = 'none';
    document.getElementById('authPage').style.display = 'flex';

    // 清空表单
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    showLogin();
}

// 显示主界面
function showMainPage() {
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('mainPage').style.display = 'block';

    // 更新用户信息显示
    const roleNames = {
        'superadmin': '超级管理员',
        'admin': '管理员',
        'customer': '客户',
        'writer': '写手'
    };
    document.getElementById('userInfo').textContent = `${roleNames[currentUser.role]}：${currentUser.username}`;

    // 显示/隐藏用户管理按钮
    const userManageBtn = document.getElementById('userManageBtn');
    if (currentUser.role === 'superadmin') {
        userManageBtn.style.display = 'block';
    } else {
        userManageBtn.style.display = 'none';
    }

    // 显示/隐藏项目过滤器
    const projectFilter = document.getElementById('projectFilter');
    if (currentUser.role === 'superadmin') {
        projectFilter.style.display = 'flex';
        loadAdminUsers(); // 加载管理员列表到选择器
    } else {
        projectFilter.style.display = 'none';
    }
}

// 加载所有数据
async function loadData() {
    try {
        await loadProjects();
        updateStats();
    } catch (error) {
        console.error('加载数据失败:', error);
        alert('数据加载失败，请刷新页面重试');
    }
}

// 加载项目数据
async function loadProjects(viewAll = false, userId = null) {
    try {
        let url = '/api/projects';
        const params = new URLSearchParams();

        if (currentUser.role === 'superadmin' && viewAll) {
            params.append('viewAll', 'true');
        } else if (currentUser.role === 'superadmin' && userId) {
            params.append('userId', userId);
        } else if (currentUser.role === 'admin') {
            params.append('userId', currentUser.id);
        }

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        projects = await response.json();
        renderProjects();
    } catch (error) {
        console.error('加载项目失败:', error);
    }
}

// 渲染项目列表
function renderProjects() {
    const container = document.getElementById('projectsList');

    if (projects.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="bi bi-folder-x text-6xl text-gray-400 mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">暂无项目</h3>
                <p class="text-gray-500">点击"新建项目"开始创建您的第一个项目</p>
            </div>
        `;
        return;
    }

    container.innerHTML = projects.map(project => {
        const profit = (project.client_price || 0) - (project.writer_price || 0);
        const profitClass = profit >= 0 ? 'text-green-600' : 'text-red-600';

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900 truncate">${project.title}</h3>
                        <span class="px-3 py-1 rounded-full text-xs font-medium ${statusStyles[project.status] || 'status-waiting'}">
                            ${project.status}
                        </span>
                    </div>

                    <p class="text-gray-600 text-sm mb-4 line-clamp-2">${project.description || '无描述'}</p>

                    <div class="space-y-2 mb-4 text-sm text-gray-600">
                        <div class="flex items-center">
                            <i class="bi bi-person mr-2 text-gray-400"></i>
                            <span>客户: ${project.customer_name || '未分配'}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="bi bi-pencil mr-2 text-gray-400"></i>
                            <span>写手: ${project.writer_name || '未分配'}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="bi bi-person-badge mr-2 text-gray-400"></i>
                            <span>创建者: </span>
                            <span class="px-2 py-1 rounded-full text-xs font-medium ${getCreatorBadgeStyle(project.creator_name, project.created_by)}">
                                ${project.creator_name || '未知'}
                            </span>
                        </div>
                        ${project.deadline ? `
                        <div class="flex items-center">
                            <i class="bi bi-calendar mr-2 text-gray-400"></i>
                            <span>截止: ${formatDate(project.deadline)}</span>
                        </div>
                        ` : ''}
                    </div>

                    <div class="grid grid-cols-3 gap-4 mb-4 text-center text-sm">
                        <div>
                            <p class="text-gray-500 mb-1">报价</p>
                            <p class="font-semibold text-gray-900">¥${project.client_price || 0}</p>
                        </div>
                        <div>
                            <p class="text-gray-500 mb-1">成本</p>
                            <p class="font-semibold text-gray-900">¥${project.writer_price || 0}</p>
                        </div>
                        <div>
                            <p class="text-gray-500 mb-1">利润</p>
                            <p class="font-semibold ${profitClass}">¥${profit.toFixed(2)}</p>
                        </div>
                    </div>

                    <div class="flex justify-between items-center pt-4 border-t border-gray-200">
                        <div class="flex space-x-2">
                            <button onclick="viewProject(${project.id})" class="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                                <i class="bi bi-eye mr-1"></i>详情
                            </button>
                            ${(currentUser && currentUser.role === 'superadmin') || (currentUser && currentUser.role === 'admin' && project.created_by === currentUser.id) ? `
                            <button onclick="editProject(${project.id})" class="text-green-600 hover:text-green-500 text-sm font-medium">
                                <i class="bi bi-pencil mr-1"></i>编辑
                            </button>
                            <button onclick="deleteProject(${project.id})" class="text-red-600 hover:text-red-500 text-sm font-medium">
                                <i class="bi bi-trash mr-1"></i>删除
                            </button>
                            ` : ''}
                        </div>
                        ${(currentUser && currentUser.role === 'superadmin') || (currentUser && currentUser.role === 'admin' && project.created_by === currentUser.id) ? `
                        <div class="relative">
                            <select onchange="updateProjectStatus(${project.id}, this.value)" class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                ${Object.keys(statusStyles).map(status => `
                                    <option value="${status}" ${project.status === status ? 'selected' : ''}>${status}</option>
                                `).join('')}
                            </select>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 更新统计信息
function updateStats() {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p =>
        ['写作中'].includes(p.status)
    ).length;

    const totalRevenue = projects.reduce((sum, p) => sum + (p.client_price || 0), 0);
    const totalCost = projects.reduce((sum, p) => sum + (p.writer_price || 0), 0);
    const totalProfit = totalRevenue - totalCost;

    document.getElementById('totalProjects').textContent = totalProjects;
    document.getElementById('activeProjects').textContent = activeProjects;
    document.getElementById('totalRevenue').textContent = `¥${totalRevenue.toFixed(2)}`;
    document.getElementById('totalProfit').textContent = `¥${totalProfit.toFixed(2)}`;

    // 更新统计标题，显示当前查看的是哪个管理员的数据
    updateStatsTitle();
}

// 更新统计标题
function updateStatsTitle() {
    if (currentUser.role !== 'superadmin') return;

    const selector = document.getElementById('adminSelector');
    const selectedValue = selector?.value;
    let titleSuffix = '';

    if (selectedValue === 'all') {
        titleSuffix = ' (全部管理员)';
    } else if (selectedValue === 'mine') {
        titleSuffix = ' (我的项目)';
    } else if (selectedValue && selectedValue !== 'all' && selectedValue !== 'mine') {
        const selectedText = selector.options[selector.selectedIndex]?.text || '';
        titleSuffix = ` (${selectedText})`;
    }

    // 更新统计卡片标题
    const projectCountLabel = document.querySelector('#totalProjects').parentElement.querySelector('p');
    if (projectCountLabel && titleSuffix) {
        projectCountLabel.textContent = `项目数${titleSuffix}`;
    } else if (projectCountLabel && !titleSuffix) {
        projectCountLabel.textContent = '总项目数';
    }
}

// 显示新建项目模态框
function showAddProjectModal() {
    document.getElementById('addProjectModal').classList.remove('hidden');
}

// 关闭新建项目模态框
function closeAddProjectModal() {
    document.getElementById('addProjectModal').classList.add('hidden');
    document.getElementById('addProjectForm').reset();
}

// 添加项目
async function addProject() {
    const form = document.getElementById('addProjectForm');
    const formData = new FormData(form);

    // 验证必填字段
    const title = formData.get('title');
    if (!title || title.trim() === '') {
        alert('项目标题不能为空！');
        return;
    }

    const projectData = {
        title: title.trim(),
        type: formData.get('type'),
        customer_name: formData.get('customer_name') ? formData.get('customer_name').trim() : '',
        writer_name: formData.get('writer_name') ? formData.get('writer_name').trim() : '',
        description: formData.get('description') ? formData.get('description').trim() : '',
        deadline: formData.get('deadline') || null,
        client_price: parseFloat(formData.get('client_price')) || 0,
        writer_price: parseFloat(formData.get('writer_price')) || 0,
        created_by: currentUser.id
    };

    console.log('发送项目数据:', projectData);

    try {
        // 首先创建项目
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });

        const result = await response.json();
        console.log('服务器响应:', result);

        if (response.ok) {
            const projectId = result.id;

            // 如果有文件需要上传
            if (uploadedFiles.length > 0 || uploadedImages.length > 0) {
                await uploadProjectFiles(projectId);
            }

            alert('项目创建成功！');
            closeAddProjectModal();
            await loadProjects();
            updateStats();
        } else {
            console.error('服务器错误:', result);
            alert(result.error || '创建失败，请重试');
        }
    } catch (error) {
        console.error('创建项目失败:', error);
        alert('网络错误或服务器无响应，请检查连接后重试');
    }
}

// 上传项目文件
async function uploadProjectFiles(projectId) {
    const formData = new FormData();

    // 添加所有文件
    uploadedFiles.forEach(file => {
        formData.append('files', file);
    });

    // 添加所有图片
    uploadedImages.forEach(image => {
        formData.append('files', image);
    });

    // 添加项目ID
    formData.append('projectId', projectId);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('文件上传失败:', error);
            alert('文件上传失败: ' + (error.error || '未知错误'));
        } else {
            console.log('文件上传成功');
        }
    } catch (error) {
        console.error('文件上传错误:', error);
        alert('文件上传失败，请重试');
    }
}

// 更新项目状态
async function updateProjectStatus(projectId, newStatus) {
    try {
        const response = await fetch(`/api/projects/${projectId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            await loadProjects();
            updateStats();
        } else {
            throw new Error('更新失败');
        }
    } catch (error) {
        console.error('更新项目状态失败:', error);
        alert('更新状态失败，请重试');
    }
}

// 查看项目详情
async function viewProject(projectId) {
    try {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        // 获取项目时间线
        const timelineResponse = await fetch(`/api/projects/${projectId}/timeline`);
        const timeline = await timelineResponse.json();

        const content = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">${project.title}</h4>
                    <p class="text-gray-600 mb-6">${project.description || '无描述'}</p>

                    <div class="bg-gray-50 rounded-lg p-4 mb-6">
                        <h5 class="font-medium text-gray-900 mb-3">项目信息</h5>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-500">项目类型：</span>
                                <span class="text-gray-900">${project.type || '-'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">客户：</span>
                                <span class="text-gray-900">${project.customer_name || '未分配'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">写手：</span>
                                <span class="text-gray-900">${project.writer_name || '未分配'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">截止日期：</span>
                                <span class="text-gray-900">${project.deadline ? formatDate(project.deadline) : '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h5 class="font-medium text-gray-900 mb-3">项目时间线</h5>
                        <div class="space-y-3">
                            ${timeline.length > 0 ? timeline.map(item => `
                                <div class="flex items-center space-x-3">
                                    <div class="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                    <div class="flex-1">
                                        <div class="flex items-center justify-between">
                                            <span class="px-2 py-1 rounded-full text-xs font-medium ${statusStyles[item.status] || 'status-waiting'}">
                                                ${item.status}
                                            </span>
                                            <span class="text-xs text-gray-500">${formatDateTime(item.created_at)}</span>
                                        </div>
                                        ${item.notes ? `<p class="text-sm text-gray-600 mt-1">${item.notes}</p>` : ''}
                                    </div>
                                </div>
                            `).join('') : '<p class="text-gray-500 text-sm">暂无时间线记录</p>'}
                        </div>
                    </div>
                </div>

                <div>
                    <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6">
                        <h5 class="font-medium text-gray-900 mb-4">财务信息</h5>
                        <div class="space-y-4">
                            <div>
                                <p class="text-sm text-gray-600 mb-1">客户报价</p>
                                <p class="text-2xl font-bold text-green-600">¥${project.client_price || 0}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600 mb-1">写手成本</p>
                                <p class="text-2xl font-bold text-red-600">¥${project.writer_price || 0}</p>
                            </div>
                            <hr class="border-gray-200">
                            <div>
                                <p class="text-sm text-gray-600 mb-1">预期利润</p>
                                <p class="text-2xl font-bold ${((project.client_price || 0) - (project.writer_price || 0)) >= 0 ? 'text-green-600' : 'text-red-600'}">
                                    ¥${((project.client_price || 0) - (project.writer_price || 0)).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('projectDetailContent').innerHTML = content;
        document.getElementById('projectDetailModal').classList.remove('hidden');
    } catch (error) {
        console.error('加载项目详情失败:', error);
        alert('加载项目详情失败');
    }
}

// 关闭项目详情模态框
function closeProjectDetailModal() {
    document.getElementById('projectDetailModal').classList.add('hidden');
}

// 工具函数：格式化日期
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}

// 工具函数：格式化日期时间
function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN');
}

// 删除项目
async function deleteProject(projectId) {
    if (!confirm('确定要删除这个项目吗？此操作不可恢复！')) {
        return;
    }

    try {
        const response = await fetch(`/api/projects/${projectId}?userId=${currentUser.id}&userRole=${currentUser.role}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('项目删除成功！');
            await loadProjects();
            updateStats();
        } else {
            const result = await response.json();
            alert(result.error || '删除失败');
        }
    } catch (error) {
        console.error('删除项目失败:', error);
        alert('删除失败，请重试');
    }
}

// 编辑项目
function editProject(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    // 填充表单数据
    document.querySelector('#addProjectForm input[name="title"]').value = project.title || '';
    document.querySelector('#addProjectForm select[name="type"]').value = project.type || '';
    document.querySelector('#addProjectForm input[name="customer_name"]').value = project.customer_name || '';
    document.querySelector('#addProjectForm input[name="writer_name"]').value = project.writer_name || '';
    document.querySelector('#addProjectForm textarea[name="description"]').value = project.description || '';
    document.querySelector('#addProjectForm input[name="deadline"]').value = project.deadline || '';
    document.querySelector('#addProjectForm input[name="client_price"]').value = project.client_price || '';
    document.querySelector('#addProjectForm input[name="writer_price"]').value = project.writer_price || '';

    // 修改模态框标题和按钮
    document.querySelector('#addProjectModal h3').textContent = '编辑项目';
    const submitBtn = document.querySelector('#addProjectModal button[onclick="addProject()"]');
    submitBtn.textContent = '保存修改';
    submitBtn.setAttribute('onclick', `updateProject(${projectId})`);

    // 显示模态框
    document.getElementById('addProjectModal').classList.remove('hidden');
}

// 更新项目
async function updateProject(projectId) {
    const form = document.getElementById('addProjectForm');
    const formData = new FormData(form);

    // 验证必填字段
    const title = formData.get('title');
    if (!title || title.trim() === '') {
        alert('项目标题不能为空！');
        return;
    }

    const projectData = {
        title: title.trim(),
        type: formData.get('type'),
        customer_name: formData.get('customer_name') ? formData.get('customer_name').trim() : '',
        writer_name: formData.get('writer_name') ? formData.get('writer_name').trim() : '',
        description: formData.get('description') ? formData.get('description').trim() : '',
        deadline: formData.get('deadline') || null,
        client_price: parseFloat(formData.get('client_price')) || 0,
        writer_price: parseFloat(formData.get('writer_price')) || 0,
        userId: currentUser.id,
        userRole: currentUser.role
    };

    try {
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projectData)
        });

        const result = await response.json();

        if (response.ok) {
            alert('项目更新成功！');
            closeAddProjectModal();
            await loadProjects();
            updateStats();
        } else {
            alert(result.error || '更新失败，请重试');
        }
    } catch (error) {
        console.error('更新项目失败:', error);
        alert('网络错误或服务器无响应，请检查连接后重试');
    }
}

// 重置新建项目模态框
function resetAddProjectModal() {
    document.querySelector('#addProjectModal h3').textContent = '新建项目';
    const submitBtn = document.querySelector('#addProjectModal button[onclick*="Project"]');
    submitBtn.textContent = '创建项目';
    submitBtn.setAttribute('onclick', 'addProject()');
}

// 修改显示新建项目模态框函数
function showAddProjectModal() {
    resetAddProjectModal();
    document.getElementById('addProjectModal').classList.remove('hidden');
}

// 文件上传功能
function triggerFileUpload() {
    document.getElementById('fileInput').click();
}

function triggerImageUpload() {
    document.getElementById('imageInput').click();
}

// 处理文件选择
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        if (uploadedFiles.length < 10) { // 限制最多10个文件
            uploadedFiles.push(file);
        }
    });
    updateFilesDisplay();
}

// 处理图片选择
function handleImageSelect(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        if (uploadedImages.length < 6) { // 限制最多6张图片
            uploadedImages.push(file);
        }
    });
    updateImagesDisplay();
}

// 更新文件显示
function updateFilesDisplay() {
    const container = document.getElementById('uploadedFiles');
    const filesList = document.getElementById('filesList');

    if (uploadedFiles.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    filesList.innerHTML = uploadedFiles.map((file, index) => `
        <div class="flex items-center justify-between bg-gray-50 rounded-lg p-2">
            <div class="flex items-center space-x-2">
                <i class="bi bi-file-earmark text-gray-500"></i>
                <span class="text-sm text-gray-700 truncate">${file.name}</span>
                <span class="text-xs text-gray-500">(${formatFileSize(file.size)})</span>
            </div>
            <button type="button" onclick="removeFile(${index})" class="text-red-500 hover:text-red-700">
                <i class="bi bi-x text-sm"></i>
            </button>
        </div>
    `).join('');
}

// 更新图片显示
function updateImagesDisplay() {
    const container = document.getElementById('imagePreview');
    const imagesList = document.getElementById('imagesList');

    if (uploadedImages.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    imagesList.innerHTML = uploadedImages.map((file, index) => {
        const imageUrl = URL.createObjectURL(file);
        return `
            <div class="relative group">
                <img src="${imageUrl}" alt="${file.name}" class="w-full h-24 object-cover rounded-lg">
                <button type="button" onclick="removeImage(${index})"
                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <i class="bi bi-x"></i>
                </button>
                <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                    ${file.name}
                </div>
            </div>
        `;
    }).join('');
}

// 移除文件
function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateFilesDisplay();
}

// 移除图片
function removeImage(index) {
    // 释放blob URL
    const imageUrl = URL.createObjectURL(uploadedImages[index]);
    URL.revokeObjectURL(imageUrl);
    uploadedImages.splice(index, 1);
    updateImagesDisplay();
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 粘贴图片功能
document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('projectDescription');

    if (textarea) {
        // 粘贴事件
        textarea.addEventListener('paste', function(e) {
            const items = e.clipboardData.items;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                if (item.type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const file = item.getAsFile();

                    if (uploadedImages.length < 6) {
                        // 重命名文件
                        const timestamp = new Date().getTime();
                        const newFile = new File([file], `pasted-image-${timestamp}.png`, {
                            type: file.type
                        });

                        uploadedImages.push(newFile);
                        updateImagesDisplay();

                        // 在文本区域添加图片说明
                        const currentValue = textarea.value;
                        const newValue = currentValue + (currentValue ? '\n\n' : '') + `📷 已添加图片: ${newFile.name}`;
                        textarea.value = newValue;
                    } else {
                        alert('最多只能上传6张图片');
                    }
                }
            }
        });

        // 拖拽功能
        textarea.addEventListener('dragover', function(e) {
            e.preventDefault();
            textarea.classList.add('border-indigo-500', 'bg-indigo-50');
        });

        textarea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            textarea.classList.remove('border-indigo-500', 'bg-indigo-50');
        });

        textarea.addEventListener('drop', function(e) {
            e.preventDefault();
            textarea.classList.remove('border-indigo-500', 'bg-indigo-50');

            const files = Array.from(e.dataTransfer.files);

            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    if (uploadedImages.length < 6) {
                        uploadedImages.push(file);
                    }
                } else {
                    if (uploadedFiles.length < 10) {
                        uploadedFiles.push(file);
                    }
                }
            });

            updateFilesDisplay();
            updateImagesDisplay();
        });
    }
});

// 修改关闭模态框函数，清理上传的文件
function closeAddProjectModal() {
    document.getElementById('addProjectModal').classList.add('hidden');
    document.getElementById('addProjectForm').reset();

    // 清理上传的文件
    uploadedFiles = [];
    uploadedImages = [];
    updateFilesDisplay();
    updateImagesDisplay();
}

// 点击模态框外部关闭
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
        if (e.target.id === 'addProjectModal') {
            closeAddProjectModal();
        } else if (e.target.id === 'projectDetailModal') {
            closeProjectDetailModal();
        } else if (e.target.id === 'addUserModal') {
            closeAddUserModal();
        } else if (e.target.id === 'editUserModal') {
            closeEditUserModal();
        }
    }
});

// 全局变量保存原始内容
let originalMainContent = '';

// 用户管理功能
function showUserManagePage() {
    if (currentUser.role !== 'superadmin') {
        alert('只有超级管理员可以访问用户管理');
        return;
    }

    const mainContent = document.getElementById('mainContent');

    // 保存原始内容
    if (!originalMainContent) {
        originalMainContent = mainContent.innerHTML;
    }

    mainContent.innerHTML = `
        <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex justify-between items-center mb-6">
                <div class="flex items-center space-x-4">
                    <button onclick="showProjectList()" class="text-gray-500 hover:text-gray-700">
                        <i class="bi bi-arrow-left text-xl"></i>
                    </button>
                    <h2 class="text-2xl font-semibold text-gray-800">用户管理</h2>
                </div>
                <button onclick="showAddUserModal()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <i class="bi bi-plus"></i>
                    <span>添加用户</span>
                </button>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full border-collapse">
                    <thead>
                        <tr class="border-b border-gray-200">
                            <th class="text-left py-3 px-4 font-medium text-gray-600">用户名</th>
                            <th class="text-left py-3 px-4 font-medium text-gray-600">角色</th>
                            <th class="text-left py-3 px-4 font-medium text-gray-600">创建时间</th>
                            <th class="text-left py-3 px-4 font-medium text-gray-600">操作</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <!-- 用户列表将动态加载 -->
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 编辑用户模态框 -->
        <div id="editUserModal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">编辑用户</h3>

                    <form id="editUserForm" onsubmit="updateUser(event)">
                        <input type="hidden" name="userId" id="editUserId">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                                <input type="text" name="username" id="editUsername" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">新密码 (留空则不修改)</label>
                                <input type="password" name="password" id="editPassword" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">角色</label>
                                <select name="role" id="editRole" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">请选择角色</option>
                                    <option value="admin">管理员</option>
                                </select>
                            </div>
                        </div>

                        <div class="flex space-x-3 mt-6">
                            <button type="button" onclick="closeEditUserModal()" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                取消
                            </button>
                            <button type="submit" class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                更新用户
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- 添加用户模态框 -->
        <div id="addUserModal" class="fixed inset-0 bg-black bg-opacity-50 hidden flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
                <div class="p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">添加新用户</h3>

                    <form id="addUserForm" onsubmit="addUser(event)">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                                <input type="text" name="username" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>


                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
                                <input type="password" name="password" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">角色</label>
                                <select name="role" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">请选择角色</option>
                                    <option value="admin">管理员</option>
                                </select>
                            </div>
                        </div>

                        <div class="flex space-x-3 mt-6">
                            <button type="button" onclick="closeAddUserModal()" class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                取消
                            </button>
                            <button type="submit" class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                                添加用户
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    loadUsers();
}

// 加载用户列表
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();

        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = users.map(user => `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3 px-4">
                    <div class="flex items-center space-x-2">
                        <span class="w-3 h-3 rounded-full ${getUserColorIndicator(user.username, user.id)}"></span>
                        <span class="text-gray-800 font-medium">${user.username}</span>
                    </div>
                </td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'superadmin' ? 'bg-purple-100 text-purple-800 border border-purple-300' : getCreatorBadgeStyle(user.username, user.id)
                    }">
                        ${user.role === 'superadmin' ? '超级管理员' : '管理员'}
                    </span>
                </td>
                <td class="py-3 px-4 text-gray-600">${new Date(user.created_at).toLocaleDateString('zh-CN')}</td>
                <td class="py-3 px-4">
                    ${user.role !== 'superadmin' ? `
                        <button onclick="editUser(${user.id}, '${user.username}', '${user.role}')" class="text-blue-500 hover:text-blue-700 text-sm mr-2">
                            编辑
                        </button>
                        <button onclick="deleteUser(${user.id}, '${user.username}')" class="text-red-500 hover:text-red-700 text-sm">
                            删除
                        </button>
                    ` : '<span class="text-gray-400 text-sm">不可编辑</span>'}
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('加载用户列表失败:', error);
        alert('加载用户列表失败: ' + error.message);

        // 显示错误消息在页面上
        const tbody = document.getElementById('usersTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="py-4 px-4 text-center text-red-500">
                        加载用户列表失败: ${error.message}
                    </td>
                </tr>
            `;
        }
    }
}

// 显示添加用户模态框
function showAddUserModal() {
    document.getElementById('addUserModal').classList.remove('hidden');
}

// 关闭添加用户模态框
function closeAddUserModal() {
    document.getElementById('addUserModal').classList.add('hidden');
    document.getElementById('addUserForm').reset();
}

// 添加用户
async function addUser(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const userData = {
        username: formData.get('username'),
        password: formData.get('password'),
        role: formData.get('role')
    };

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (response.ok) {
            alert('用户添加成功！');
            closeAddUserModal();
            loadUsers();
        } else {
            alert(result.error || '添加用户失败');
        }
    } catch (error) {
        console.error('添加用户失败:', error);
        alert('网络错误，请重试');
    }
}

// 删除用户
async function deleteUser(userId, username) {
    if (!confirm(`确定要删除用户 "${username}" 吗？`)) {
        return;
    }

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            alert('用户删除成功！');
            loadUsers();
        } else {
            alert(result.error || '删除用户失败');
        }
    } catch (error) {
        console.error('删除用户失败:', error);
        alert('网络错误，请重试');
    }
}

// 加载管理员用户列表到过滤器
async function loadAdminUsers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();

        const adminUsers = users.filter(user => user.role === 'admin' || user.role === 'superadmin');
        const selector = document.getElementById('adminSelector');

        // 清空现有选项，但保留默认选项
        selector.innerHTML = `
            <option value="all">全部项目</option>
            <option value="mine">我的项目</option>
        `;

        // 添加管理员选项
        adminUsers.forEach(admin => {
            if (admin.id !== currentUser.id) { // 不包括当前用户
                const option = document.createElement('option');
                option.value = admin.id;
                const roleDisplay = admin.role === 'superadmin' ? '超级管理员' : '管理员';
                option.textContent = `${admin.username} (${roleDisplay})`;
                selector.appendChild(option);
            }
        });
    } catch (error) {
        console.error('加载管理员列表失败:', error);
    }
}

// 过滤项目
function filterProjects() {
    const selector = document.getElementById('adminSelector');
    const selectedValue = selector.value;

    if (selectedValue === 'all') {
        loadProjects(true); // 查看所有项目
    } else if (selectedValue === 'mine') {
        loadProjects(false, currentUser.id); // 查看我的项目
    } else {
        loadProjects(false, selectedValue); // 查看特定管理员的项目
    }
}

// 为不同的创建者分配颜色样式
function getCreatorBadgeStyle(creatorName, creatorId) {
    if (!creatorName) return 'bg-gray-100 text-gray-800';

    // 为超级管理员特殊样式
    if (creatorName === 'superadmin') {
        return 'bg-purple-100 text-purple-800 border border-purple-300';
    }

    // 为不同管理员分配不同颜色
    const colors = [
        'bg-blue-100 text-blue-800 border border-blue-300',      // admin1 等
        'bg-green-100 text-green-800 border border-green-300',   // admin2 等
        'bg-yellow-100 text-yellow-800 border border-yellow-300', // siuser 等
        'bg-pink-100 text-pink-800 border border-pink-300',      // admin 等
        'bg-indigo-100 text-indigo-800 border border-indigo-300',
        'bg-red-100 text-red-800 border border-red-300',
        'bg-teal-100 text-teal-800 border border-teal-300',
        'bg-orange-100 text-orange-800 border border-orange-300'
    ];

    // 根据用户ID计算颜色索引，确保同一用户总是得到同样的颜色
    const colorIndex = (creatorId || 0) % colors.length;
    return colors[colorIndex];
}

// 获取用户颜色指示器（小圆点）
function getUserColorIndicator(username, userId) {
    if (username === 'superadmin') {
        return 'bg-purple-500';
    }

    const colors = [
        'bg-blue-500',      // admin1 等
        'bg-green-500',     // admin2 等
        'bg-yellow-500',    // siuser 等
        'bg-pink-500',      // admin 等
        'bg-indigo-500',
        'bg-red-500',
        'bg-teal-500',
        'bg-orange-500'
    ];

    const colorIndex = (userId || 0) % colors.length;
    return colors[colorIndex];
}

// 调试用户管理功能
function debugUserManage() {
    console.log('调试按钮被点击');
    console.log('当前用户:', currentUser);

    // 直接测试用户管理页面显示
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) {
        alert('错误：找不到 mainContent 元素');
        return;
    }

    mainContent.innerHTML = `
        <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">调试：用户管理页面</h2>
            <p class="text-green-600 mb-4">✅ 用户管理页面显示正常!</p>
            <p class="text-sm text-gray-600 mb-4">当前用户: ${currentUser.username} (${currentUser.role})</p>

            <button onclick="showUserManagePage()" class="bg-blue-500 text-white px-4 py-2 rounded mr-2">
                加载完整用户管理页面
            </button>
            <button onclick="showProjectList()" class="bg-gray-500 text-white px-4 py-2 rounded">
                返回项目列表
            </button>
        </div>
    `;
}

// 编辑用户
function editUser(userId, username, role) {
    document.getElementById('editUserId').value = userId;
    document.getElementById('editUsername').value = username;
    document.getElementById('editRole').value = role;
    document.getElementById('editPassword').value = '';
    document.getElementById('editUserModal').classList.remove('hidden');
}

// 关闭编辑用户模态框
function closeEditUserModal() {
    document.getElementById('editUserModal').classList.add('hidden');
    document.getElementById('editUserForm').reset();
}

// 更新用户
async function updateUser(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const userData = {
        username: formData.get('username'),
        role: formData.get('role')
    };

    // 只有填写了密码才更新密码
    const password = formData.get('password');
    if (password && password.trim()) {
        userData.password = password;
    }

    const userId = formData.get('userId');

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (response.ok) {
            alert('用户更新成功！');
            closeEditUserModal();
            loadUsers();
        } else {
            alert(result.error || '更新用户失败');
        }
    } catch (error) {
        console.error('更新用户失败:', error);
        alert('网络错误，请重试');
    }
}

// 显示项目列表（返回主页面）
function showProjectList() {
    const mainContent = document.getElementById('mainContent');
    if (originalMainContent) {
        mainContent.innerHTML = originalMainContent;
        // 重新加载项目数据
        loadData();
    } else {
        // 如果没有保存的内容，刷新页面
        location.reload();
    }
}