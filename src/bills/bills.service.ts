import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Bill } from '../entities/bill.entity';
import { UserBill } from '../entities/user-bill.entity';
import { User } from '../entities/user.entity';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(UserBill)
    private userBillRepository: Repository<UserBill>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(createBillDto: CreateBillDto): Promise<Bill> {
    const { participants, ...billData } = createBillDto;

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

    // Criar conta e participantes em uma transação
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Criar a conta
      const bill = this.billRepository.create(billData);
      const savedBill = await queryRunner.manager.save(bill);

      // Criar os participantes
      for (const participant of participants) {
        const userBill = this.userBillRepository.create({
          user_id: participant.user_id,
          bill_id: savedBill.id,
          share_percentage: participant.share_percentage,
          is_paid: false,
        });
        await queryRunner.manager.save(userBill);
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
      relations: ['userBills', 'userBills.user'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Bill> {
    const bill = await this.billRepository.findOne({
      where: { id },
      relations: ['userBills', 'userBills.user'],
    });

    if (!bill) {
      throw new NotFoundException(`Conta com ID ${id} não encontrada`);
    }

    return bill;
  }

  async findByUser(userId: number): Promise<Bill[]> {
    const userBills = await this.userBillRepository.find({
      where: { user_id: userId },
      relations: ['bill', 'bill.userBills', 'bill.userBills.user'],
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
}
