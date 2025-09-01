// 测试登录页面功能的脚本
// 在浏览器控制台中运行此脚本来测试功能

console.log('=== 登录页面功能测试 ===');

// 测试1: 检查DOM元素是否存在
console.log('\n1. 检查DOM元素:');
const elements = {
    'showRegisterBtn': document.getElementById('showRegisterBtn'),
    'adminQuickLogin': document.getElementById('adminQuickLogin'),
    'userQuickLogin': document.getElementById('userQuickLogin'),
    'registerModal': document.getElementById('registerModal'),
    'closeRegisterBtn': document.getElementById('closeRegisterBtn'),
    'cancelRegisterBtn': document.getElementById('cancelRegisterBtn')
};

Object.entries(elements).forEach(([name, element]) => {
    console.log(`${name}: ${element ? '✓ 存在' : '✗ 不存在'}`);
});

// 测试2: 检查全局函数
console.log('\n2. 检查全局函数:');
const functions = ['showRegisterForm', 'closeRegisterModal', 'quickLogin'];
functions.forEach(func => {
    console.log(`${func}: ${typeof window[func] === 'function' ? '✓ 存在' : '✗ 不存在'}`);
});

// 测试3: 检查LoginPage实例
console.log('\n3. 检查LoginPage实例:');
console.log(`window.loginPage: ${window.loginPage ? '✓ 存在' : '✗ 不存在'}`);

// 测试4: 模拟点击事件
console.log('\n4. 测试点击事件:');
if (elements.showRegisterBtn) {
    console.log('模拟点击注册按钮...');
    elements.showRegisterBtn.click();
    
    setTimeout(() => {
        const modal = document.getElementById('registerModal');
        const isVisible = modal && modal.classList.contains('active');
        console.log(`注册模态框是否显示: ${isVisible ? '✓ 是' : '✗ 否'}`);
        
        // 关闭模态框
        if (isVisible && elements.closeRegisterBtn) {
            console.log('关闭模态框...');
            elements.closeRegisterBtn.click();
        }
    }, 100);
}

// 测试5: 检查快速登录按钮的数据属性
console.log('\n5. 检查快速登录数据属性:');
if (elements.adminQuickLogin) {
    console.log(`管理员邮箱: ${elements.adminQuickLogin.getAttribute('data-email')}`);
    console.log(`管理员密码: ${elements.adminQuickLogin.getAttribute('data-password')}`);
}

if (elements.userQuickLogin) {
    console.log(`用户邮箱: ${elements.userQuickLogin.getAttribute('data-email')}`);
    console.log(`用户密码: ${elements.userQuickLogin.getAttribute('data-password')}`);
}

console.log('\n=== 测试完成 ===');
console.log('如果所有项目都显示 ✓，则功能正常');
console.log('现在可以手动点击注册按钮和快速登录按钮进行测试');
