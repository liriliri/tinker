import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Toolbar, ToolbarSpacer, ToolbarSearch } from 'share/components/Toolbar'
import store from '../store'

const ListToolbar = observer(() => {
  const { t } = useTranslation()

  return (
    <Toolbar>
      <ToolbarSpacer />
      <ToolbarSearch
        value={store.listFilter}
        onChange={(val) => store.setListFilter(val)}
        placeholder={t('filter')}
      />
    </Toolbar>
  )
})

export default ListToolbar
