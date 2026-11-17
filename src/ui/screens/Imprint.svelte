<script lang="ts">
  import { t } from '../../i18n';
  import LegalPage from './LegalPage.svelte';
</script>

<LegalPage title={t('imprint.title')} paragraphs={[t('imprint.body'), t('imprint.contact')]} />
