## 系统设计
![system design](./Untitled-2024-12-06-1002.png)

## 功能实现
1. 排行榜功能
    - [x] 支持玩家分数更新，实时计算排名
    - [x] 提供排行榜分页查询，每页最多100条数据
    - [x] 支持查询指定玩家当前排名
    - [x] 支持查询指定玩家附近排名（上下10名）
    - [x] 处理同分数玩家的排序（按时间倒序）
2. 实时通知功能
    - [x] WebSocket 连接的建立与维护
    - [x] 排名变化消息的实时推送
    - [x] 进入前100名的提醒推送(推送中包含目前排名, 可以在前端检测然后做对应处理)
    - [x] 被其他玩家超越的提醒推送
    - [x] 断线重连机制
    - [x] 消息可靠性保证机制
3. 在线状态处理
    - [x] 维护玩家在线状态
    - [x] 处理网络异常断开
    - [x] 支持客户端主动断开
    - [x] 定期的心跳检测

## 异常处理
- 异常捕获和处理机制 nestjs 提供了@Catch, ExceptionFilter 等 utils
- 业务异常分类 apps/apis/src/Exception/httpException.ts
- 错误日志记录 apps/apis/src/exceptionFilter/allExceptionFilter.ts
- 提供排查工具 
## 监控和运维
- 核心指标监控 Prometheus/datadog
- 异常告警机制 apps/apis/src/exceptionFilter/allExceptionFilter.ts
- 操作审计日志 apps/apis/src/services/audit.service.ts
- 系统诊断接口

## 加分项
- 合理的单元测试设计 apps/apis/src/services/score.service.spec.ts
- 完善的日志记录 完善的输出, 可以依赖平台的数收能力
- 性能优化方案 应当更换使用 socket.io, 还可以从开发的便利性角度进行优化, 比如 service 功能的解耦上
- 高可用设计方案 gateway 双活; http server 在 load balancer 之后多实例, 可扩展; 数据库/redis 主从或者集群
- 安全性考虑 jwt 保护接口和 websocket