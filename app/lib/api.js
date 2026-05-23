const BASE_URL = 'http://localhost:5001/api';

function getToken() {
  return localStorage.getItem('token');
}

export async function signup(data) {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function login(data) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
  return res.json();
}

export async function getTrips() {
  const res = await fetch(`${BASE_URL}/trips`, {
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
  return res.json();
}

export async function createTrip(data) {
  const res = await fetch(`${BASE_URL}/trips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateTrip(id, data) {
  const res = await fetch(`${BASE_URL}/trips/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteTrip(id) {
  const res = await fetch(`${BASE_URL}/trips/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });
  return res.json();
}