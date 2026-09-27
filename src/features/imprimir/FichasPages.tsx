import { useLoaderData } from 'react-router'
import { CartaAliado } from '../../components/CartaAliado'
import { CartaHeroe } from '../../components/CartaHeroe'
import { CartaMonstruo } from '../../components/CartaMonstruo'
import type { cargarAliados, cargarBestiario } from '../../lib/personajes'
import { ImprimirFichas } from './ImprimirFichas'
import type { cargarFichasHeroes } from './rutas'

export function FichasHeroesPage() {
  const { heroes, habilidades } = useLoaderData<typeof cargarFichasHeroes>()
  const grupo = (id: 'clasico' | 'extra', nombre: string) => ({
    id,
    nombre,
    fichas: heroes
      .filter((h) => h.grupo === id)
      .map((h) => ({
        clave: h.id,
        nombre: h.nombre,
        mini: <CartaHeroe heroe={h} />,
        completa: <CartaHeroe heroe={h} habilidades={habilidades} variante="completa" />,
      })),
  })

  return <ImprimirFichas titulo="Fichas de héroes" grupos={[grupo('clasico', 'Héroes clásicos'), grupo('extra', 'Héroes extra')]} />
}

export function FichasMonstruosPage() {
  const familias = useLoaderData<typeof cargarBestiario>()
  const grupos = familias.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    // la versión avanzada es otra ficha, justo detrás de la normal
    fichas: f.monstruos.flatMap((m) =>
      [false, ...(m.avanzado ? [true] : [])].map((avanzado) => ({
        clave: `${m.id}${avanzado ? ':avanzado' : ''}`,
        nombre: `${m.nombre}${avanzado ? ' avanzado' : ''}`,
        mini: <CartaMonstruo monstruo={m} avanzado={avanzado} />,
        completa: <CartaMonstruo monstruo={m} avanzado={avanzado} variante="completa" />,
      })),
    ),
  }))

  return <ImprimirFichas titulo="Fichas de monstruos" grupos={grupos} />
}

export function FichasAliadosPage() {
  const grupos = useLoaderData<typeof cargarAliados>().map((g) => ({
    id: g.id,
    nombre: g.nombre,
    fichas: g.aliados.map((a) => ({
      clave: `${g.id}/${a.id}`,
      nombre: a.nombre,
      mini: <CartaAliado aliado={a} />,
      completa: <CartaAliado aliado={a} variante="completa" />,
    })),
  }))

  return <ImprimirFichas titulo="Fichas de aliados" grupos={grupos} />
}
