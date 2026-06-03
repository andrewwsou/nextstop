const BASE_URL = '/api';
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

export async function searchTransitRoutes(params) {
  const query = new URLSearchParams(params);
  const res = await fetch(`${BASE_URL}/transit/routes?${query.toString()}`);
  return res.json();
}

export async function updateName(data) {
  const res = await fetch(`${BASE_URL}/auth/name`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateEmail(data) {
  const res = await fetch(`${BASE_URL}/auth/email`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updatePassword(data) {
  const res = await fetch(`${BASE_URL}/auth/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
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
