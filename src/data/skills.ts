import reactIcon from '../assets/svg/react.svg'
import angularIcon from '../assets/svg/angular.svg'
import javaIcon from '../assets/svg/java.svg'
import springIcon from '../assets/svg/spring.svg'
import postgresqlIcon from '../assets/svg/postgresql.svg'
import mongodbIcon from '../assets/svg/mongodb.svg'
import redisIcon from '../assets/svg/redis.svg'
import dockerIcon from '../assets/svg/docker.svg'

export type SkillGroup = 'front' | 'back' | 'data' | 'ops'

export interface Skill {
  name: string
  icon: string
  group: SkillGroup
}

export const skills: Skill[] = [
  { name: 'React', icon: reactIcon, group: 'front' },
  { name: 'Angular', icon: angularIcon, group: 'front' },
  { name: 'Java', icon: javaIcon, group: 'back' },
  { name: 'Spring Boot', icon: springIcon, group: 'back' },
  { name: 'PostgreSQL', icon: postgresqlIcon, group: 'data' },
  { name: 'MongoDB', icon: mongodbIcon, group: 'data' },
  { name: 'Redis', icon: redisIcon, group: 'data' },
  { name: 'Docker', icon: dockerIcon, group: 'ops' },
]

export const skillGroups: SkillGroup[] = ['front', 'back', 'data', 'ops']
