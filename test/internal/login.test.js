import request from 'supertest';
import { expect } from 'chai';
import app from '../../src/app.js';
import * as sinon from 'sinon';
import authService from '../../src/services/auth.service.js';

describe('Login', () => {
  it('deve retornar 500 quando o usuário e senha forem corretos', async () => {
    const authServiceMock = sinon.stub(authService, 'login');
    authServiceMock.throws(new Error ('ERRROOOOOOOOOOO!!!'))
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: 'admin@escola.com',
        senha: 'admin123',
      });

    expect(loginResponse.status).to.equal(500);
    expect(loginResponse.body.error).to.equal('Erro interno do servidor.');

    authServiceMock.restore();
  });

  it('deve retornar 200 quando o usuário e senha forem corretos', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: 'admin@escola.com',
        senha: 'admin123',
      });

    expect(loginResponse.status).to.equal(200);
    expect(loginResponse.body).to.have.property('token');
    expect(loginResponse.body.usuario).to.include({
      id: 'admin-principal',
      nome: 'Administrador do Sistema',
      email: 'admin@escola.com',
      role: 'admin',
    });
  });
  it('deve retornar 400 quando o usuário for incorreto', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: 'aninha@escola.com',
        senha: 'admin123',
      });

    expect(loginResponse.status).to.equal(401);
    expect(loginResponse.body).to.include( {
        error: 'E-mail ou senha inválidos.'
    });
  });
    it('deve retornar 400 quando senha for vazia', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({
        email: 'aninha@escola.com',
        senha: '',
      });

    expect(loginResponse.status).to.equal(400);
    expect(loginResponse.body).to.include( {
        error: 'Os campos "email" e "senha" são obrigatórios.'
    });
  });
});
