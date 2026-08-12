import { Controller, Get, Injectable, Module, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect, serializeProfile } from '../common/serialization/serializers';

@Injectable()
export class ProfileService {
    constructor(private readonly prisma: PrismaService) {}

    async findOne(id: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { id },
            include: { user: { select: publicUserSelect } },
        });

        if (!profile) {
            throw new NotFoundException(`Профиль ${id} не найден`);
        }

        return serializeProfile(profile);
    }
}

@Controller('profile')
export class ProfileController {
    constructor(private readonly profile: ProfileService) {}

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.profile.findOne(id);
    }
}

@Module({
    controllers: [ProfileController],
    providers: [ProfileService],
})
export class ProfileModule {}
