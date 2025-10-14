import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Bill, BillType } from '../entities/bill.entity';
import { UserBill, UserBillStatus } from '../entities/user-bill.entity';
import { User } from '../entities/user.entity';
import { BillValue } from '../entities/bill-value.entity';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { CreateBillValueDto } from './dto/create-bill-value.dto';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(UserBill)
    private userBillRepository: Repository<UserBill>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(BillValue)
    private billValueRepository: Repository<BillValue>,
    private dataSource: DataSource,
  ) {}

  async create(createBillDto: CreateBillDto): Promise<Bill> {
    const {
      participants,
      current_month_value,
      total_value,
      installments,
      start_month,
      start_year,
      type,
      ...billData
    } = createBillDto;

    // Validar campos obrigatórios por tipo
    if (type === BillType.PARCELADA) {
      if (!total_value || !installments || !start_month || !start_year) {
        throw new BadRequestException(
          'Para contas parceladas, total_value, installments, start_month e start_year são obrigatórios',
        );
      }
    } else if (type === BillType.RECORRENTE) {
      if (!current_month_value) {
        throw new BadRequestException(
          'Para contas recorrentes, current_month_value é obrigatório',
        );
      }
    }

    // Validar que a soma das porcentagens é 100
    const totalPercentage = participants.reduce(
      (sum, p) => sum + p.share_percentage,
      0,
    );
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new BadRequestException('A soma das porcentagens deve ser 100%');
    }

    // Verificar se todos os usuários existem
    for (const participant of participants) {
      const user = await this.userRepository.findOne({
        where: { id: participant.user_id },
      });
      if (!user) {
        throw new NotFoundException(
          `Usuário com ID ${participant.user_id} não encontrado`,
        );
      }
    }

    // Verificar se o dono existe
    const owner = await this.userRepository.findOne({
      where: { id: billData.owner_id },
    });
    if (!owner) {
      throw new NotFoundException('Usuário dono não encontrado');
    }

    // Criar conta e participantes em uma transação
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Criar a conta
      const bill = this.billRepository.create({
        ...billData,
        type,
        total_value: type === BillType.PARCELADA ? total_value : null,
        installments: type === BillType.PARCELADA ? installments : null,
        start_month: type === BillType.PARCELADA ? start_month : null,
        start_year: type === BillType.PARCELADA ? start_year : null,
      });
      const savedBill = await queryRunner.manager.save(bill);

      // Criar os participantes
      for (const participant of participants) {
        const isOwner = participant.user_id === billData.owner_id;
        const userBill = this.userBillRepository.create({
          user_id: participant.user_id,
          bill_id: savedBill.id,
          share_percentage: participant.share_percentage,
          is_paid: false,
          // Dono já aceita automaticamente, outros ficam pendentes
          status: isOwner ? UserBillStatus.ACCEPTED : UserBillStatus.PENDING,
        });
        await queryRunner.manager.save(userBill);
      }

      // Criar valores mensais
      if (type === BillType.PARCELADA) {
        // Dividir o valor total pelas parcelas
        const valuePerInstallment = total_value / installments;

        for (let i = 0; i < installments; i++) {
          const monthDate = new Date(
            start_year,
            start_month - 1 + i,
            billData.due_day,
          );
          const billValue = this.billValueRepository.create({
            bill_id: savedBill.id,
            month: monthDate.getMonth() + 1,
            year: monthDate.getFullYear(),
            value: valuePerInstallment,
            installment_number: i + 1,
            due_date: monthDate,
          });
          await queryRunner.manager.save(billValue);
        }
      } else if (type === BillType.RECORRENTE) {
        // Criar apenas para o mês atual
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const dueDate = new Date(
          currentYear,
          currentMonth - 1,
          billData.due_day,
        );

        const billValue = this.billValueRepository.create({
          bill_id: savedBill.id,
          month: currentMonth,
          year: currentYear,
          value: current_month_value,
          installment_number: null,
          due_date: dueDate,
        });
        await queryRunner.manager.save(billValue);
      }

      await queryRunner.commitTransaction();
      return await this.findOne(savedBill.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Bill[]> {
    return await this.billRepository.find({
      relations: ['userBills', 'userBills.user', 'billValues', 'owner'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Bill> {
    const bill = await this.billRepository.findOne({
      where: { id },
      relations: ['userBills', 'userBills.user', 'billValues', 'owner'],
    });

    if (!bill) {
      throw new NotFoundException(`Conta com ID ${id} não encontrada`);
    }

    return bill;
  }

  async findByUser(userId: number): Promise<Bill[]> {
    const userBills = await this.userBillRepository.find({
      where: { user_id: userId },
      relations: [
        'bill',
        'bill.userBills',
        'bill.userBills.user',
        'bill.billValues',
        'bill.owner',
      ],
    });

    return userBills.map((ub) => ub.bill);
  }

  async update(id: number, updateBillDto: UpdateBillDto): Promise<Bill> {
    const bill = await this.findOne(id);

    if (updateBillDto.participants) {
      const totalPercentage = updateBillDto.participants.reduce(
        (sum, p) => sum + p.share_percentage,
        0,
      );
      if (Math.abs(totalPercentage - 100) > 0.01) {
        throw new BadRequestException('A soma das porcentagens deve ser 100%');
      }

      // Remover participantes antigos e adicionar novos
      await this.userBillRepository.delete({ bill_id: id });

      for (const participant of updateBillDto.participants) {
        const userBill = this.userBillRepository.create({
          user_id: participant.user_id,
          bill_id: id,
          share_percentage: participant.share_percentage,
          is_paid: false,
        });
        await this.userBillRepository.save(userBill);
      }
    }

    const { participants, ...billData } = updateBillDto;
    Object.assign(bill, billData);
    await this.billRepository.save(bill);

    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const bill = await this.findOne(id);
    await this.billRepository.remove(bill);
  }

  async markAsPaid(
    billId: number,
    userId: number,
    isPaid: boolean,
  ): Promise<void> {
    const userBill = await this.userBillRepository.findOne({
      where: { bill_id: billId, user_id: userId },
    });

    if (!userBill) {
      throw new NotFoundException('Participante não encontrado nesta conta');
    }

    userBill.is_paid = isPaid;
    await this.userBillRepository.save(userBill);
  }

  async acceptInvite(
    billId: number,
    userId: number,
    status: UserBillStatus.ACCEPTED | UserBillStatus.REJECTED,
  ): Promise<void> {
    const userBill = await this.userBillRepository.findOne({
      where: { bill_id: billId, user_id: userId },
    });

    if (!userBill) {
      throw new NotFoundException('Convite não encontrado');
    }

    if (userBill.status !== UserBillStatus.PENDING) {
      throw new BadRequestException('Este convite já foi respondido');
    }

    userBill.status = status;
    await this.userBillRepository.save(userBill);
  }

  async createBillValue(
    createBillValueDto: CreateBillValueDto,
  ): Promise<BillValue> {
    const { bill_id, month, year, value } = createBillValueDto;

    // Verificar se a conta existe e é recorrente
    const bill = await this.findOne(bill_id);
    if (bill.type !== BillType.RECORRENTE) {
      throw new BadRequestException(
        'Valores só podem ser criados manualmente para contas recorrentes',
      );
    }

    // Verificar se já existe um valor para este mês/ano
    const existingValue = await this.billValueRepository.findOne({
      where: { bill_id, month, year },
    });

    if (existingValue) {
      throw new BadRequestException(
        'Já existe um valor para este mês/ano. Use o endpoint de atualização.',
      );
    }

    // Criar a data de vencimento
    const dueDate = new Date(year, month - 1, bill.due_day);

    const billValue = this.billValueRepository.create({
      bill_id,
      month,
      year,
      value,
      installment_number: null,
      due_date: dueDate,
    });

    return await this.billValueRepository.save(billValue);
  }

  async updateBillValue(
    billValueId: number,
    value: number,
  ): Promise<BillValue> {
    const billValue = await this.billValueRepository.findOne({
      where: { id: billValueId },
      relations: ['bill'],
    });

    if (!billValue) {
      throw new NotFoundException('Valor mensal não encontrado');
    }

    // Verificar se a conta é recorrente (valores de contas parceladas não podem ser editados)
    if (billValue.bill.type !== BillType.RECORRENTE) {
      throw new BadRequestException(
        'Valores de contas parceladas não podem ser editados individualmente',
      );
    }

    billValue.value = value;
    return await this.billValueRepository.save(billValue);
  }

  async getBillValues(
    billId: number,
    month?: number,
    year?: number,
  ): Promise<BillValue[]> {
    const where: any = { bill_id: billId };

    if (month !== undefined) {
      where.month = month;
    }

    if (year !== undefined) {
      where.year = year;
    }

    return await this.billValueRepository.find({
      where,
      relations: ['bill'],
      order: { year: 'ASC', month: 'ASC' },
    });
  }

  async getPendingInvites(userId: number): Promise<UserBill[]> {
    return await this.userBillRepository.find({
      where: { user_id: userId, status: UserBillStatus.PENDING },
      relations: [
        'bill',
        'bill.owner',
        'bill.userBills',
        'bill.userBills.user',
      ],
    });
  }
}
