import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateSettings } from './updateSettings';

// DOM ELEMENTS
const mapbox = document.getElementById('map');
const form = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateDataForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-password');

// DELEGATION
if (mapbox) {
  const locations = JSON.parse(mapbox.dataset.locations);
  displayMap(locations);
}

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}

if (updateDataForm) {
  updateDataForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    updateSettings({ email, name }, 'data');
  });
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async e => {
    e.preventDefault();
    document.querySelector('.btn--save-password').innerText = 'Updating....';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');
    // document.getElementById('password-current').value = ''
    // document.getElementById('password').value = ''
    // document.getElementById('password-confirm').value = ''
    document.querySelector('.btn--save-password').innerText = 'Save password';
  });
}