import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { UploaderComponent } from './uploader/uploader.component';

const routes: Routes = [
  {
    path: 'preview',
    component: SidebarComponent,
  },
  {
    path: '',
    component: UploaderComponent,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
