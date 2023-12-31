import { prisma } from '@ioc:Adonis/Addons/Prisma'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Recipe } from 'App/Models/Recipe'
import User from 'App/Models/User'
import { QueryItems } from 'App/utils/QueryItems'

type RecipeQuery = {
  title?: string
  servingsFrom?: number
  servingsTo?: number
  totalTimeInMinutesFrom?: number
  totalTimeInMinutesTo?: number
  ingredients?: string
  userId?: string
  skip?: number
  count?: number
}

export default class RecipesController {
  public async index({ request }: HttpContextContract): Promise<Recipe[]> {
    const queryItems: RecipeQuery = QueryItems.parse(request.parsedUrl.query ?? '')
    const recipes = await prisma.recipe.findMany({
      where: {
        AND: this.generateWhereFilter(queryItems),
      },
      skip: queryItems.skip ? +queryItems.skip : 0,
      take: queryItems.count ? +queryItems.count : 20,
      select: {
        id: true,
        title: true,
        servings: true,
        totalTimeInMinutes: true,
        updatedAt: true,
      },
    })
    return recipes.map(({ id, title, servings, totalTimeInMinutes, updatedAt }) => {
      return {
        id,
        title,
        servings,
        totalTimeInMinutes,
        updatedAt: updatedAt.toISOString(),
      }
    })
  }

  private generateWhereFilter(queryItems: RecipeQuery): any[] {
    const AND: any[] = []
    if (queryItems.title) AND.push({ title: { contains: queryItems.title } })
    if (queryItems.servingsFrom) AND.push({ servings: { gte: +queryItems.servingsFrom } })
    if (queryItems.servingsTo) AND.push({ servings: { lte: +queryItems.servingsTo } })
    if (queryItems.totalTimeInMinutesFrom)
      AND.push({ totalTimeInMinutes: { gte: +queryItems.totalTimeInMinutesFrom } })
    if (queryItems.totalTimeInMinutesTo)
      AND.push({ totalTimeInMinutes: { lte: +queryItems.totalTimeInMinutesTo } })
    if (queryItems.ingredients)
      AND.push({ ingredients: { some: { product: { contains: queryItems.ingredients } } } })
    if (queryItems.userId) AND.push({ userId: { equals: queryItems.userId } })
    return AND
  }

  public async show({ params }: HttpContextContract): Promise<Recipe> {
    const id: string = params.id
    const recipe = await prisma.recipe.findUniqueOrThrow({ where: { id } })
    const user = await User.query()
      .where('idmain', recipe.userId)
      .select(['idmain', 'name'])
      .first()
    if (!user) throw new Error('user not found')
    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      servings: recipe.servings,
      totalTimeInMinutes: recipe.totalTimeInMinutes,
      ingredients: recipe.ingredients,
      directions: recipe.directions,
      createdAt: recipe.createdAt.toISOString(),
      updatedAt: recipe.updatedAt.toISOString(),
      user: {
        id: user.idmain,
        name: user.name,
      },
    }
  }

  public async store({ request, response }: HttpContextContract): Promise<{ id: string }> {
    const input: Record<string, string> = request.body()
    const { title, ingredients, directions }: Recipe = input
    const userId = QueryItems.parse(request.parsedUrl.query ?? '')['userId']
    if (!userId) throw new Error('missing user id')
    const recipe = await prisma.recipe.create({
      data: {
        title,
        description: input.description,
        servings: +input.servings,
        totalTimeInMinutes: +input.totalTimeInMinutes,
        ingredients,
        directions,
        userId,
      },
    })
    response.status(201)
    return {
      id: recipe.id,
    }
  }

  public async update({ request, params }: HttpContextContract): Promise<{ id: string }> {
    const id: string = params.id
    const userId = QueryItems.parse(request.parsedUrl.query ?? '')['userId']
    if (!userId) throw new Error('missing user id')
    const input: Record<string, string> = request.body()
    const recipe = await prisma.recipe.findUniqueOrThrow({
      where: { id, userId },
      select: {
        id: true,
        title: true,
        description: true,
        servings: true,
        totalTimeInMinutes: true,
        ingredients: true,
        directions: true,
      },
    })
    if (input.title) recipe.title = input.title
    if (input.description) recipe.description = input.description
    if (input.servings) recipe.servings = +input.servings
    if (input.totalTimeInMinutes) recipe.totalTimeInMinutes = +input.totalTimeInMinutes
    if (input.ingredients) recipe.ingredients = JSON.parse(JSON.stringify(input.ingredients))
    if (input.directions) recipe.directions = JSON.parse(JSON.stringify(input.directions))
    await prisma.recipe.update({
      where: { id },
      data: {
        title: recipe.title,
        description: recipe.description,
        servings: recipe.servings,
        totalTimeInMinutes: recipe.totalTimeInMinutes,
        ingredients: recipe.ingredients,
        directions: recipe.directions,
        updatedAt: new Date(),
      },
    })
    return {
      id,
    }
  }

  public async destroy({ request, params }: HttpContextContract): Promise<{ id: string }> {
    const id: string = params.id
    const userId = QueryItems.parse(request.parsedUrl.query ?? '')['userId']
    if (!userId) throw new Error('missing user id')
    await prisma.recipe.delete({ where: { id, userId } })
    return {
      id,
    }
  }
}
