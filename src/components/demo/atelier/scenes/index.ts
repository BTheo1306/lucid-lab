import type { ComponentType } from 'react'

import type { SceneId } from '@/lib/demo/atelier/types'

import { Scene00Intro } from './Scene00Intro'
import { Scene01Formulaire } from './Scene01Formulaire'
import { Scene02Reponse } from './Scene02Reponse'
import { Scene03Crm } from './Scene03Crm'
import { Scene04Boite } from './Scene04Boite'
import { Scene05Journee } from './Scene05Journee'
import { Scene06CompteRendu } from './Scene06CompteRendu'
import { Scene07Commande } from './Scene07Commande'
import { Scene08Facturation } from './Scene08Facturation'
import { Scene09Bilan } from './Scene09Bilan'
import type { SceneProps } from './types'

export const SCENE_COMPONENTS: Record<SceneId, ComponentType<SceneProps>> = {
  intro: Scene00Intro,
  formulaire: Scene01Formulaire,
  reponse: Scene02Reponse,
  crm: Scene03Crm,
  boite: Scene04Boite,
  journee: Scene05Journee,
  'compte-rendu': Scene06CompteRendu,
  commande: Scene07Commande,
  facturation: Scene08Facturation,
  bilan: Scene09Bilan,
}
