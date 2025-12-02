import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Payment } from '../entities/payment.entity';
import { HistoryBalance } from '../entities/history-balance.entity';
import { ActualBalance } from '../entities/actual-balance.entity';
import { BillValue } from '../entities/bill-value.entity';
import { UserBill } from '../entities/user-bill.entity';
import { Bill } from '../entities/bill.entity';
import { User } from '../entities/user.entity';

// Carregar variáveis de ambiente
config();

async function clearDatabase() {
  console.log('========================================');
  console.log('  Limpeza do Banco de Dados');
  console.log('========================================');
  console.log('');

  // Criar DataSource
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [
      User,
      Bill,
      UserBill,
      Payment,
      ActualBalance,
      HistoryBalance,
      BillValue,
    ],
    synchronize: false, // Não queremos sincronizar, apenas limpar
    logging: true,
  });

  try {
    // Conectar ao banco
    await dataSource.initialize();
    console.log('✅ Conectado ao banco de dados');
    console.log('');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('🗑️  Limpando dados das tabelas...');
      console.log('');

      // Desabilitar temporariamente as verificações de foreign key
      await queryRunner.query('SET session_replication_role = replica');

      // Limpar dados em ordem (respeitando foreign keys)
      await queryRunner.query('TRUNCATE TABLE payment CASCADE');
      console.log('  ✓ payment');

      await queryRunner.query('TRUNCATE TABLE history_balance CASCADE');
      console.log('  ✓ history_balance');

      await queryRunner.query('TRUNCATE TABLE actual_balance CASCADE');
      console.log('  ✓ actual_balance');

      await queryRunner.query('TRUNCATE TABLE bill_values CASCADE');
      console.log('  ✓ bill_values');

      await queryRunner.query('TRUNCATE TABLE user_bills CASCADE');
      console.log('  ✓ user_bills');

      await queryRunner.query('TRUNCATE TABLE bills CASCADE');
      console.log('  ✓ bills');

      await queryRunner.query('TRUNCATE TABLE users CASCADE');
      console.log('  ✓ users');

      // Reabilitar as verificações de foreign key
      await queryRunner.query('SET session_replication_role = origin');

      console.log('');
      console.log('🔧 Ajustando estrutura da tabela payment...');

      // Remover colunas antigas se existirem
      const hasMonthColumn = (await queryRunner.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment' AND column_name = 'month'
      `)) as Array<{ '?column?': number }>;

      if (hasMonthColumn.length > 0) {
        await queryRunner.query('ALTER TABLE payment DROP COLUMN month');
        console.log('  ✓ Removida coluna month');
      }

      const hasYearColumn = (await queryRunner.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment' AND column_name = 'year'
      `)) as Array<{ '?column?': number }>;

      if (hasYearColumn.length > 0) {
        await queryRunner.query('ALTER TABLE payment DROP COLUMN year');
        console.log('  ✓ Removida coluna year');
      }

      // Adicionar coluna bill_value_id se não existir
      const hasBillValueIdColumn = (await queryRunner.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment' AND column_name = 'bill_value_id'
      `)) as Array<{ '?column?': number }>;

      if (hasBillValueIdColumn.length === 0) {
        await queryRunner.query(
          'ALTER TABLE payment ADD COLUMN bill_value_id integer',
        );
        await queryRunner.query(
          'ALTER TABLE payment ALTER COLUMN bill_value_id SET NOT NULL',
        );
        await queryRunner.query(`
          ALTER TABLE payment 
          ADD CONSTRAINT fk_payment_bill_value 
          FOREIGN KEY (bill_value_id) 
          REFERENCES bill_values(id) 
          ON DELETE CASCADE
        `);
        await queryRunner.query(
          'CREATE INDEX IF NOT EXISTS idx_payment_bill_value_id ON payment(bill_value_id)',
        );
        console.log('  ✓ Adicionada coluna bill_value_id');
      }

      await queryRunner.commitTransaction();
      console.log('');

      // Verificar se as tabelas estão vazias
      console.log('📊 Verificando registros restantes...');
      const counts = (await queryRunner.query(`
        SELECT 
          'payment' as tabela, COUNT(*) as registros FROM payment
        UNION ALL
        SELECT 'history_balance', COUNT(*) FROM history_balance
        UNION ALL
        SELECT 'actual_balance', COUNT(*) FROM actual_balance
        UNION ALL
        SELECT 'bill_values', COUNT(*) FROM bill_values
        UNION ALL
        SELECT 'user_bills', COUNT(*) FROM user_bills
        UNION ALL
        SELECT 'bills', COUNT(*) FROM bills
        UNION ALL
        SELECT 'users', COUNT(*) FROM users
      `)) as Array<{ tabela: string; registros: string }>;

      for (const row of counts) {
        const count = parseInt(row.registros, 10);
        const status = count === 0 ? '✅' : '⚠️';
        console.log(`  ${status} ${row.tabela}: ${count} registros`);
      }

      console.log('');
      console.log('========================================');
      console.log('  ✅ Limpeza concluída com sucesso!');
      console.log('========================================');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('');
    console.error('❌ Erro ao limpar o banco de dados:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// Executar
void clearDatabase();
