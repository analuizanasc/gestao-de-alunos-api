import request from 'supertest';
import { api } from './api.js'

let tokenEmCache = null;
export async function comTokenAdmin() {
  if ( !tokenEmCache ) {
    const loginResposta = await api()
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send({
      email: process.env.ADMIN_EMAIL,
      senha: process.env.ADMIN_SENHA
    });
    tokenEmCache = loginResposta.body.token;
  }
  return `Bearer ${tokenEmCache}`;
}
export async function getToken(emailUser, passUser) {
  const loginResposta = await request('http://localhost:3000')
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send({
      email: emailUser,
      senha: passUser
    });

  return loginResposta.body.token;
}
