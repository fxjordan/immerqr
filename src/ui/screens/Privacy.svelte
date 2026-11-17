<script lang="ts">
  import { t } from '../../i18n';
  import LegalPage from './LegalPage.svelte';
</script>

<LegalPage
  title={t('privacy.title')}
  paragraphs={[t('privacy.body'), t('privacy.hosting'), t('privacy.contact')]}
/>
