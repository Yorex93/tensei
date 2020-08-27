import Knex from 'knex'
import Faker from 'faker'
import Bcrypt from 'bcryptjs'
import { tool, Tool, User as IUser } from '@flamingo/common'
import Flamingo, { flamingo } from '../../Flamingo'

import { Tag, Comment, User, Post } from './resources'

interface ConfigureSetup {
    tools?: Tool[],
    admin?: IUser
    apiPath?: string
    dashboardPath?: string
}

let cachedInstance: Flamingo|null = null

export const setup = async ({ tools, admin, apiPath, dashboardPath }: ConfigureSetup = {}, forceNewInstance = false) => {
    process.env.DATABASE = 'mysql'
    process.env.DATABASE_URI = 'mysql://root@127.0.0.1/testdb'

    let instance = forceNewInstance ? flamingo() : cachedInstance ? cachedInstance : flamingo()

    cachedInstance = instance

    instance.tools([
        ...(tools || []),
        ...(admin ? [
            tool('Force auth').beforeDatabaseSetup(async ({ app }) => {
                app.use((request, response, next) => {
                    request.admin = admin

                    next()
                })
            })
        ] : [])
    ])

    if (apiPath) {
        instance.apiPath(apiPath)
    }

    if (dashboardPath) {
        instance.dashboardPath(dashboardPath)
    }

    instance = await instance.resources([Post, Tag, User, Comment]).register()

    const knex: Knex = instance.databaseClient

    await knex('sessions').truncate()
    await knex('administrators').truncate()

    return instance
}

export const cleanup = async (databaseClient: Knex) => {
    await databaseClient.destroy()
}

export const createAdminUser = async (knex: Knex) => {
    const user = {
        name: Faker.name.findName(),
        email: Faker.internet.email(),
        password: 'password',
    }

    const id = await knex('administrators').insert({
        name: user.name,
        email: user.email,
        password: Bcrypt.hashSync(user.password),
    })

    return {
        id: id[0],
        ...user,
    }
}
