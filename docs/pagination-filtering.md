# 食谱 API 分页和过滤功能

本文档介绍了食谱 API 的分页和过滤功能，以及如何使用这些功能来获取特定的食谱数据。

## 基本用法

获取食谱列表的基本 API 端点：

```
GET /api/recipes
```

默认情况下，此端点将返回第一页的 10 条食谱记录，按创建时间降序排序。

## 分页参数

以下参数可用于控制分页：

| 参数    | 类型 | 默认值 | 描述                    |
| ------- | ---- | ------ | ----------------------- |
| `page`  | 整数 | 1      | 页码，从 1 开始         |
| `limit` | 整数 | 10     | 每页记录数，最大值为 50 |

### 示例

获取第 2 页，每页 20 条记录：

```
GET /api/recipes?page=2&limit=20
```

## 过滤参数

以下参数可用于过滤食谱：

| 参数             | 类型       | 描述                                              |
| ---------------- | ---------- | ------------------------------------------------- |
| `cuisineType`    | 字符串     | 按菜系类型过滤（如"中餐"、"川菜"、"粤菜"等）      |
| `dietType`       | 字符串数组 | 按饮食类型过滤，多个值用逗号分隔（如"素食,低脂"） |
| `name`           | 字符串     | 按食谱名称过滤（模糊匹配）                        |
| `minCalories`    | 整数       | 按最小卡路里过滤                                  |
| `maxCalories`    | 整数       | 按最大卡路里过滤                                  |
| `maxCookingTime` | 整数       | 按最大烹饪时间（分钟）过滤                        |

### 示例

获取烹饪时间不超过 30 分钟的中餐食谱：

```
GET /api/recipes?cuisineType=中餐&maxCookingTime=30
```

获取名称包含"红烧"的食谱：

```
GET /api/recipes?name=红烧
```

获取卡路里在 300-500 之间的食谱：

```
GET /api/recipes?minCalories=300&maxCalories=500
```

## 排序参数

以下参数可用于控制结果的排序：

| 参数        | 类型   | 默认值      | 描述                                                                      |
| ----------- | ------ | ----------- | ------------------------------------------------------------------------- |
| `sortBy`    | 字符串 | "createdAt" | 排序字段，可选值："name", "createdAt", "views", "cookingTime", "calories" |
| `sortOrder` | 字符串 | "desc"      | 排序顺序，可选值："asc"（升序）, "desc"（降序）                           |

### 示例

按烹饪时间升序排序：

```
GET /api/recipes?sortBy=cookingTime&sortOrder=asc
```

按浏览量降序排序：

```
GET /api/recipes?sortBy=views&sortOrder=desc
```

## 组合使用

所有参数可以组合使用，例如：

```
GET /api/recipes?cuisineType=川菜&maxCookingTime=30&sortBy=calories&sortOrder=asc&page=2&limit=10
```

上述请求将返回：

- 菜系为川菜
- 烹饪时间不超过 30 分钟
- 按卡路里升序排序
- 第 2 页的数据
- 每页 10 条记录

## 响应格式

成功响应的格式如下：

```json
{
  "success": true,
  "data": {
    "recipes": [
      {
        "id": "recipe_id",
        "name": "食谱名称",
        "ingredients": [...],
        "steps": [...],
        "calories": 500,
        "cookingTime": 30,
        "nutritionFacts": {...},
        "cuisineType": "中餐",
        "dietType": ["素食"],
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-01T00:00:00Z",
        "views": 100
      },
      // ... 更多食谱
    ],
    "pagination": {
      "total": 100,  // 总记录数
      "page": 2,     // 当前页码
      "limit": 10,   // 每页记录数
      "pages": 10    // 总页数
    }
  }
}
```

## 错误处理

如果请求出错，API 将返回以下格式的响应：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

常见错误代码：

- `VALIDATION_ERROR`: 请求参数验证失败
- `INTERNAL_SERVER_ERROR`: 服务器内部错误

## 测试

可以使用以下命令运行分页和过滤功能的测试：

```bash
npm run test:pagination
```

这将运行所有与分页和过滤相关的测试用例。
