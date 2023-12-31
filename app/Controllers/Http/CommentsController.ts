import { prisma } from '@ioc:Adonis/Addons/Prisma'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Comment } from 'App/Models/Comment'
import User, { UserDto } from 'App/Models/User'
import { QueryItems } from 'App/utils/QueryItems'

export default class CommentsController {
  public async index({ params }: HttpContextContract): Promise<Comment[]> {
    const recipeId = params.recipeid
    if (!recipeId) throw new Error('missing recipeId')
    const recipe = await prisma.comment.findMany({
      where: { recipeId },
      select: { id: true, text: true, createdAt: true, userId: true },
    })
    const userIdList = recipe.map((r) => r.userId)
    const users = await User.query().whereIn('idmain', userIdList).select(['idmain', 'name'])
    return recipe.map(({ id, text, createdAt, userId }) => {
      return {
        id,
        text,
        createdAt: createdAt.toISOString(),
        user: this.findUser(users, userId),
      }
    })
  }

  private findUser(users: User[], userId: string): UserDto {
    const user = users.find(({ idmain }) => idmain.localeCompare(userId) === 0)
    if (!user) return {}
    const { idmain, name } = user
    return {
      id: idmain,
      name,
    }
  }

  public async store({ request, params, response }: HttpContextContract): Promise<{ id: string }> {
    const text = request.body()['text']
    const recipeId = params.recipeid
    const userId = QueryItems.parse(request.parsedUrl.query ?? '')['userId']
    if (!userId) throw new Error('missing user id')
    await prisma.recipe.findUniqueOrThrow({ where: { id: recipeId } })
    const comment = await prisma.comment.create({ data: { recipeId, userId, text } })
    response.status(201)
    return {
      id: comment.id,
    }
  }

  public async destroy({ request, params }: HttpContextContract): Promise<{ id: string }> {
    const id: string = params.commentid
    const userId = QueryItems.parse(request.parsedUrl.query ?? '')['userId']
    if (!userId) throw new Error('missing user id')
    await prisma.comment.delete({ where: { id, userId } })
    return {
      id,
    }
  }
}
