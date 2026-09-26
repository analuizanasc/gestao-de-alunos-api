import request from 'supertest';

export async function cadastrarDisciplina(nomeAluno, emailAluno) {
  const cadastroAlunoResposta = await request('http://localhost:3000')
        .post('/api/admin/alunos')
        .set('Content-Type', 'application/json')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nome: nomeAluno,
          email: emailAluno,
          matricula: `2026-${Date.now()}`,
          senha: '123456'
        });

  return cadastroAlunoResposta.body;
}
