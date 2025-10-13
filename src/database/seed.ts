import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Bill } from '../entities/bill.entity';
import { UserBill } from '../entities/user-bill.entity';
import { Payment } from '../entities/payment.entity';
import { ActualBalance } from '../entities/actual-balance.entity';
import { HistoryBalance } from '../entities/history-balance.entity';

export async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'racha_mes',
    entities: [User, Bill, UserBill, Payment, ActualBalance, HistoryBalance],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('🔌 Conectado ao banco de dados');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('🌱 Iniciando seed...');

    // Limpar dados existentes
    await queryRunner.query(
      'TRUNCATE TABLE history_balance RESTART IDENTITY CASCADE',
    );
    await queryRunner.query(
      'TRUNCATE TABLE actual_balance RESTART IDENTITY CASCADE',
    );
    await queryRunner.query('TRUNCATE TABLE payment RESTART IDENTITY CASCADE');
    await queryRunner.query(
      'TRUNCATE TABLE user_bills RESTART IDENTITY CASCADE',
    );
    await queryRunner.query('TRUNCATE TABLE bills RESTART IDENTITY CASCADE');
    await queryRunner.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
    console.log('🗑️  Dados antigos removidos');

    // Criar usuários
    const hashedPassword = await bcrypt.hash('senha123', 10);

    const user1 = queryRunner.manager.create(User, {
      name: 'João da Silva',
      email: 'joao@email.com',
      phone_number: '+5511999999999',
      password: hashedPassword,
    });

    const user2 = queryRunner.manager.create(User, {
      name: 'Maria Santos',
      email: 'maria@email.com',
      phone_number: '+5511888888888',
      password: hashedPassword,
    });

    const user3 = queryRunner.manager.create(User, {
      name: 'Pedro Oliveira',
      email: 'pedro@email.com',
      phone_number: '+5511777777777',
      password: hashedPassword,
    });

    const user4 = queryRunner.manager.create(User, {
      name: 'Ana Costa',
      email: 'ana@email.com',
      phone_number: '+5511666666666',
      password: hashedPassword,
    });

    await queryRunner.manager.save([user1, user2, user3, user4]);
    console.log('👥 Usuários criados');

    // Criar contas
    const bill1 = queryRunner.manager.create(Bill, {
      descript: 'Aluguel do Apartamento',
      value: 2000.0,
      due_date: new Date('2025-10-05'),
      payment_number: 1,
    });

    const bill2 = queryRunner.manager.create(Bill, {
      descript: 'Conta de Luz',
      value: 300.0,
      due_date: new Date('2025-10-10'),
      payment_number: 1,
    });

    const bill3 = queryRunner.manager.create(Bill, {
      descript: 'Internet',
      value: 150.0,
      due_date: new Date('2025-10-15'),
      payment_number: 1,
    });

    const bill4 = queryRunner.manager.create(Bill, {
      descript: 'Condomínio',
      value: 500.0,
      due_date: new Date('2025-10-20'),
      payment_number: 1,
    });

    await queryRunner.manager.save([bill1, bill2, bill3, bill4]);
    console.log('💰 Contas criadas');

    // Criar participantes das contas

    // Aluguel - 4 pessoas dividem igualmente
    const userBill1_1 = queryRunner.manager.create(UserBill, {
      user_id: user1.id,
      bill_id: bill1.id,
      share_percentage: 25,
      is_paid: false,
    });

    const userBill1_2 = queryRunner.manager.create(UserBill, {
      user_id: user2.id,
      bill_id: bill1.id,
      share_percentage: 25,
      is_paid: false,
    });

    const userBill1_3 = queryRunner.manager.create(UserBill, {
      user_id: user3.id,
      bill_id: bill1.id,
      share_percentage: 25,
      is_paid: false,
    });

    const userBill1_4 = queryRunner.manager.create(UserBill, {
      user_id: user4.id,
      bill_id: bill1.id,
      share_percentage: 25,
      is_paid: false,
    });

    // Conta de Luz - 4 pessoas dividem igualmente
    const userBill2_1 = queryRunner.manager.create(UserBill, {
      user_id: user1.id,
      bill_id: bill2.id,
      share_percentage: 25,
      is_paid: false,
    });

    const userBill2_2 = queryRunner.manager.create(UserBill, {
      user_id: user2.id,
      bill_id: bill2.id,
      share_percentage: 25,
      is_paid: false,
    });

    const userBill2_3 = queryRunner.manager.create(UserBill, {
      user_id: user3.id,
      bill_id: bill2.id,
      share_percentage: 25,
      is_paid: false,
    });

    const userBill2_4 = queryRunner.manager.create(UserBill, {
      user_id: user4.id,
      bill_id: bill2.id,
      share_percentage: 25,
      is_paid: false,
    });

    // Internet - Apenas 3 pessoas
    const userBill3_1 = queryRunner.manager.create(UserBill, {
      user_id: user1.id,
      bill_id: bill3.id,
      share_percentage: 33.33,
      is_paid: false,
    });

    const userBill3_2 = queryRunner.manager.create(UserBill, {
      user_id: user2.id,
      bill_id: bill3.id,
      share_percentage: 33.33,
      is_paid: false,
    });

    const userBill3_3 = queryRunner.manager.create(UserBill, {
      user_id: user3.id,
      bill_id: bill3.id,
      share_percentage: 33.34,
      is_paid: false,
    });

    // Condomínio - 2 pessoas (50% cada)
    const userBill4_1 = queryRunner.manager.create(UserBill, {
      user_id: user1.id,
      bill_id: bill4.id,
      share_percentage: 50,
      is_paid: false,
    });

    const userBill4_2 = queryRunner.manager.create(UserBill, {
      user_id: user2.id,
      bill_id: bill4.id,
      share_percentage: 50,
      is_paid: false,
    });

    await queryRunner.manager.save([
      userBill1_1,
      userBill1_2,
      userBill1_3,
      userBill1_4,
      userBill2_1,
      userBill2_2,
      userBill2_3,
      userBill2_4,
      userBill3_1,
      userBill3_2,
      userBill3_3,
      userBill4_1,
      userBill4_2,
    ]);
    console.log('📝 Participantes das contas criados');

    // Criar alguns pagamentos
    const payment1 = queryRunner.manager.create(Payment, {
      user_id: user1.id,
      bill_id: bill1.id,
      payment_value: 2000.0, // João pagou o aluguel completo
      payed_at: new Date('2025-10-05'),
    });

    const payment2 = queryRunner.manager.create(Payment, {
      user_id: user2.id,
      bill_id: bill2.id,
      payment_value: 300.0, // Maria pagou a luz completa
      payed_at: new Date('2025-10-10'),
    });

    await queryRunner.manager.save([payment1, payment2]);

    // Atualizar last_occurrence das contas
    bill1.last_occurrence = new Date('2025-10-05');
    bill2.last_occurrence = new Date('2025-10-10');
    await queryRunner.manager.save([bill1, bill2]);

    console.log('💳 Pagamentos registrados');

    // Criar saldos baseados nos pagamentos

    // João pagou o aluguel (2000), sua parte era 500 (25%)
    // Então cada um dos outros 3 deve 500 para João
    const balance1_1 = queryRunner.manager.create(ActualBalance, {
      debtor_user_id: user2.id,
      borrower_user_id: user1.id,
      value: 500.0,
    });

    const balance1_2 = queryRunner.manager.create(ActualBalance, {
      debtor_user_id: user3.id,
      borrower_user_id: user1.id,
      value: 500.0,
    });

    const balance1_3 = queryRunner.manager.create(ActualBalance, {
      debtor_user_id: user4.id,
      borrower_user_id: user1.id,
      value: 500.0,
    });

    // Maria pagou a luz (300), sua parte era 75 (25%)
    // Então cada um dos outros 3 deve 75 para Maria
    const balance2_1 = queryRunner.manager.create(ActualBalance, {
      debtor_user_id: user1.id,
      borrower_user_id: user2.id,
      value: 75.0,
    });

    const balance2_2 = queryRunner.manager.create(ActualBalance, {
      debtor_user_id: user3.id,
      borrower_user_id: user2.id,
      value: 75.0,
    });

    const balance2_3 = queryRunner.manager.create(ActualBalance, {
      debtor_user_id: user4.id,
      borrower_user_id: user2.id,
      value: 75.0,
    });

    await queryRunner.manager.save([
      balance1_1,
      balance1_2,
      balance1_3,
      balance2_1,
      balance2_2,
      balance2_3,
    ]);
    console.log('💸 Saldos criados');

    // Criar histórico
    const history1_1 = queryRunner.manager.create(HistoryBalance, {
      debtor_user_id: user2.id,
      borrower_user_id: user1.id,
      bill_id: bill1.id,
      descript: 'Pagamento de Aluguel do Apartamento - Outubro/2025',
      value: 500.0,
    });

    const history1_2 = queryRunner.manager.create(HistoryBalance, {
      debtor_user_id: user3.id,
      borrower_user_id: user1.id,
      bill_id: bill1.id,
      descript: 'Pagamento de Aluguel do Apartamento - Outubro/2025',
      value: 500.0,
    });

    const history1_3 = queryRunner.manager.create(HistoryBalance, {
      debtor_user_id: user4.id,
      borrower_user_id: user1.id,
      bill_id: bill1.id,
      descript: 'Pagamento de Aluguel do Apartamento - Outubro/2025',
      value: 500.0,
    });

    const history2_1 = queryRunner.manager.create(HistoryBalance, {
      debtor_user_id: user1.id,
      borrower_user_id: user2.id,
      bill_id: bill2.id,
      descript: 'Pagamento de Conta de Luz - Outubro/2025',
      value: 75.0,
    });

    const history2_2 = queryRunner.manager.create(HistoryBalance, {
      debtor_user_id: user3.id,
      borrower_user_id: user2.id,
      bill_id: bill2.id,
      descript: 'Pagamento de Conta de Luz - Outubro/2025',
      value: 75.0,
    });

    const history2_3 = queryRunner.manager.create(HistoryBalance, {
      debtor_user_id: user4.id,
      borrower_user_id: user2.id,
      bill_id: bill2.id,
      descript: 'Pagamento de Conta de Luz - Outubro/2025',
      value: 75.0,
    });

    await queryRunner.manager.save([
      history1_1,
      history1_2,
      history1_3,
      history2_1,
      history2_2,
      history2_3,
    ]);
    console.log('📚 Histórico criado');

    await queryRunner.commitTransaction();
    console.log('✅ Seed concluído com sucesso!');
    console.log('\n📊 Dados criados:');
    console.log('   - 4 usuários');
    console.log('   - 4 contas');
    console.log('   - 13 participantes');
    console.log('   - 2 pagamentos');
    console.log('   - 6 saldos');
    console.log('   - 6 registros de histórico');
    console.log('\n🔑 Credenciais de login (todas as senhas são "senha123"):');
    console.log('   - joao@email.com');
    console.log('   - maria@email.com');
    console.log('   - pedro@email.com');
    console.log('   - ana@email.com');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Erro ao executar seed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }
}

// Executar seed se o arquivo for chamado diretamente
if (require.main === module) {
  runSeed()
    .then(() => {
      console.log('\n👋 Seed finalizado!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}
