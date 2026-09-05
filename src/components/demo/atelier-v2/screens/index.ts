import type { ComponentType } from 'react'

import type { SceneId } from '@/lib/demo/atelier/types'

import { BilanScreen } from './BilanScreen'
import { BoiteScreen } from './BoiteScreen'
import { CommandeScreen } from './CommandeScreen'
import { CompteRenduScreen } from './CompteRenduScreen'
import { CrmScreen } from './CrmScreen'
import { FacturationScreen } from './FacturationScreen'
import { FormulaireScreen } from './FormulaireScreen'
import { IntroScreen } from './IntroScreen'
import { JourneeScreen } from './JourneeScreen'
import { ReponseScreen } from './ReponseScreen'
import type { ScreenProps } from './types'

export const SCREENS: Record<SceneId, ComponentType<ScreenProps>> = {
  intro: IntroScreen,
  formulaire: FormulaireScreen,
  reponse: ReponseScreen,
  crm: CrmScreen,
  boite: BoiteScreen,
  journee: JourneeScreen,
  'compte-rendu': CompteRenduScreen,
  commande: CommandeScreen,
  facturation: FacturationScreen,
  bilan: BilanScreen,
}
