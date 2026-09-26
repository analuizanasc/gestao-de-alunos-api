import request from 'supertest';
import { expect } from 'chai';
import { getToken } from '../helpers/auth.js';

describe('Login', () => {
  let token;

  beforeEach(async () => {
    token = await getToken('admin@escola.com', 'admin123');
  });

  it('deve cadastrar um aluno quando ele informa dados válidos', async () => {
    // Cadastrar o aluno
    const cadastroAlunoResposta = await request('http://localhost:3000')
      .post('/api/admin/alunos')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nome: 'Julio de Lima',
        email: 'julio.lima@example.com',
        matricula: '2026-0001',
        senha: '123456'
      });

    // Validar que ele foi cadastrado
    expect(cadastroAlunoResposta.status).to.equal(201);
    expect(cadastroAlunoResposta.body.nome).to.equal('Julio de Lima');
    expect(cadastroAlunoResposta.body.email).to.equal('julio.lima@example.com');
    expect(cadastroAlunoResposta.body.matricula).to.equal('2026-0001');
  });

  it('deve negar o cadastro de um aluno quando ele já existe', async () => {
    //considera-se um dado existente - garantindo que o dado continuará no moomento
    const dadosAluno = {
      nome: 'Ana Souza',
      email: 'ana.souza@example.com',
      matricula: '2024001',
      senha: '123456'
    };

    // Tentar cadastrar o mesmo aluno novamente
    const cadastroAlunoResposta = await request('http://localhost:3000')
      .post('/api/admin/alunos')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${token}`)
      .send(dadosAluno);

    // Validar que o cadastro foi negado
    expect(cadastroAlunoResposta.status).to.equal(409);
    expect(cadastroAlunoResposta.body.error).to.equal('Já existe um aluno cadastrado com essa matrícula ou e-mail.');
  });
});
