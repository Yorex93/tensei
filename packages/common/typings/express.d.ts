import { Request } from 'express'
import { Mail } from '@tensei/mail'
import { StorageManager } from '@slynova/flydrive'
import { MikroORM, EntityManager } from '@mikro-orm/core'
import {
    User,
    Asset,
    Config,
    ManagerContract,
    ResourceContract,
    DashboardContract
} from '@tensei/common'

declare global {
    namespace Express {
        export interface Request {
            resources: {
                [key: string]: ResourceContract
            }
            dashboards: {
                [key: string]: DashboardContract
            }
            mailer: Mail
            config: Config
            admin_user: User
            orm: MikroORM
            manager: EntityManager
            scripts: Asset[]
            styles: Asset[]
            originatedFromDashboard: boolean | undefined
            authenticationError: (message?: string) => unknown
            forbiddenError: (message?: string) => unknown
            validationError: (message?: string) => unknown
            userInputError: (message?: string) => unknown
        }
    }
}
