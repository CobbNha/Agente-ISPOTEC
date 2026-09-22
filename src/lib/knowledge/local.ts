export const LOCAL_ISPOTEC_KNOWLEDGE = `BASE OFICIAL ISPOTEC

Cursos 2027: Mestrado em Saúde Pública, 2 anos, laboral ou pós-laboral, semi-presencial ou online, para licenciados em Ciências de Saúde, Biológicas ou áreas afins. Inscrição e matrícula: 10.000 Mt. Propina: 10.000 Mt + IVA.

Licenciaturas de 4 anos com estágios, para nível médio/12ª classe ou equivalente. Inscrição e matrícula: 4.000 Mt. Psicologia Clínica e Saúde no Trabalho: 6.000 Mt/mês. Enfermagem Geral: 6.500 Mt/mês. Saúde Pública: 6.000 Mt/mês. Direito, Administração e Gestão de Recursos Humanos, Contabilidade e Finanças: 5.000 Mt/mês.

Pós-graduações: 8 meses, online, pós-laboral, nas áreas de Saúde, Direito e Administração. Cursos de especialização incluem Pedagogia, Didática, Supervisão Pedagógica, Psicoterapia, Saúde Ocupacional e Enfermagem. Cursos curtos incluem Primeiros Socorros, Enfermagem Domiciliária, Empreendedorismo, Marketing e Recursos Humanos.

Contactos ISPOTEC: 878787442, 877906666, 873045610. Email: Ispotec.politecnica@gmail.com. Endereço: Rua da Mozal, 5354, Paragem Antena, Matola-Rio, Maputo.

Regulamento Académico e Pedagógico V2022: a primeira matrícula obedece a exames de acesso e vagas por curso. O ingresso tem como base a 12ª classe ou equivalente. Documentos de inscrição: BI/passaporte; certificado de habilitações e cópia autenticada; ficha de inscrição; comprovativo de pagamento; duas fotografias tipo passe. A inscrição não é reembolsável. Para prova/entrevista é obrigatório BI/passaporte válido e recibo. A matrícula vincula o estudante ao ISPOTEC, faz-se uma vez e a confirmação é anual.

Responder apenas com informação oficial. Quando faltar informação, recomendar confirmação com a Secretaria Académica.`

export function findLocalAnswer(question: string): string | null {
  const q = question.toLowerCase()
  const has = (...terms: string[]) => terms.some((term) => q.includes(term))
  if (has('contacto', 'telefone', 'email', 'endereço', 'morada')) return 'Contactos ISPOTEC:\n878787442 | 877906666 | 873045610\nIspotec.politecnica@gmail.com\nRua da Mozal, 5354, Paragem Antena, Matola-Rio, Maputo.'
  if (has('documento', 'documentos') && has('inscri', 'candidatura', 'matrícul')) return 'Documentos: BI ou passaporte; certificado de habilitações com cópia autenticada; ficha de inscrição; comprovativo de pagamento; duas fotografias tipo passe.'
  if (has('propina', 'preço', 'valor', 'mensalidade', 'mensal')) return 'Propinas: Enfermagem Geral 6.500 Mt; Psicologia Clínica e Saúde Pública 6.000 Mt; Direito, Administração, Gestão de Recursos Humanos, Contabilidade e Finanças 5.000 Mt; Mestrado em Saúde Pública 10.000 Mt + IVA.'
  return null
}
`;
